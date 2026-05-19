package com.coco.domain.company.service;

import com.coco.domain.company.config.EmissionFactors;
import com.coco.domain.company.dto.ExcelUploadResponse;
import com.coco.domain.company.dto.ExcelUploadResponse.RowError;
import com.coco.domain.company.entity.Company;
import com.coco.domain.company.entity.CompanyActivity;
import com.coco.domain.company.entity.ExcelUploadHistory;
import com.coco.domain.company.repository.CompanyActivityRepository;
import com.coco.domain.company.repository.CompanyRepository;
import com.coco.domain.company.repository.ExcelUploadHistoryRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ExcelUploadService {

    private final CompanyRepository companyRepository;
    private final CompanyActivityRepository activityRepository;
    private final ExcelUploadHistoryRepository historyRepository;

    private static final Pattern BILLING_MONTH_PATTERN = Pattern.compile("^\\d{4}-\\d{2}$");

    // ── 허용값 집합 ────────────────────────────────────────────────────────
    private static final Set<String> FUEL_TYPES = Set.of(
            "LNG", "도시가스LNG", "도시가스(LNG)", "도시가스LPG", "도시가스(LPG)",
            "경유", "휘발유", "등유", "LPG");
    private static final Set<String> VEHICLE_TYPES = Set.of("승용차", "승합차", "화물차");
    private static final Set<String> MOBILE_FUEL_TYPES = Set.of("휘발유", "경유", "LPG");
    private static final Set<String> LOGISTICS_TYPES = Set.of("택배", "화물", "항공", "선박");
    private static final Set<String> WASTE_TYPES = Set.of("일반", "플라스틱", "폐유", "음식물", "기타");
    private static final Set<String> DISPOSAL_METHODS = Set.of("소각", "재활용", "매립");

    /**
     * 카테고리별 업로드. category 지정 시 해당 시트만 파싱.
     * null/blank 시 전체 시트 처리.
     */
    @Transactional
    public ExcelUploadResponse upload(MultipartFile file, String category) {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        List<RowError> errors = new ArrayList<>();
        int savedCount = 0;

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            if (category == null || category.isBlank()) {
                // 전체 처리
                savedCount += processElectricity(wb, company, errors);
                savedCount += processStationary(wb, company, errors);
                savedCount += processMobileVehicle(wb, company, errors);
                savedCount += processMobileLogistics(wb, company, errors);
                savedCount += processProcessGas(wb, company, errors);
                savedCount += processWaste(wb, company, errors);
                savedCount += processWater(wb, company, errors);
            } else {
                switch (category) {
                    case "BUSINESS_ELECTRICITY"           -> savedCount += processElectricity(wb, company, errors);
                    case "BUSINESS_STATIONARY_COMBUSTION" -> savedCount += processStationary(wb, company, errors);
                    case "BUSINESS_MOBILE_COMBUSTION"     -> {
                        savedCount += processMobileVehicle(wb, company, errors);
                        savedCount += processMobileLogistics(wb, company, errors);
                    }
                    case "BUSINESS_PROCESS_GAS"           -> savedCount += processProcessGas(wb, company, errors);
                    case "BUSINESS_WASTE"                 -> savedCount += processWaste(wb, company, errors);
                    case "BUSINESS_WATER"                 -> savedCount += processWater(wb, company, errors);
                    default -> { /* 알 수 없는 카테고리 — 스킵 */ }
                }
            }
        } catch (IOException e) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }

        // 업로드 이력 저장 (카테고리 포함)
        historyRepository.save(ExcelUploadHistory.builder()
                .company(company)
                .category(category != null ? category : "ALL")
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown.xlsx")
                .savedCount(savedCount)
                .errorCount(errors.size())
                .build());

        return ExcelUploadResponse.builder()
                .success(errors.isEmpty())
                .savedCount(savedCount)
                .errorCount(errors.size())
                .errors(errors)
                .build();
    }

    // ── Sheet 1: 전력 ──────────────────────────────────────────────────────
    private int processElectricity(Workbook wb, Company company, List<RowError> errors) {
        Sheet sheet = wb.getSheet("전력");
        if (sheet == null) return 0;

        Map<String, Integer> cols = readHeader(sheet);
        int saved = 0;
        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (isBlankRow(row) || isNoteRow(row)) continue;

            Double usageKwh = getDouble(row, cols, "usage_kwh");
            String month    = getString(row, cols, "billing_month");
            double renewableRatio = Optional.ofNullable(getDouble(row, cols, "renewable_ratio"))
                    .map(v -> v / 100.0).orElse(0.0);

            if (!validateRequired("전력", r, "usage_kwh", usageKwh, errors)) continue;
            if (!validateBillingMonth("전력", r, month, errors)) continue;
            if (usageKwh < 0) { errors.add(err("전력", r, "usage_kwh", "음수값 입력")); continue; }

            double co2e = usageKwh * (1 - renewableRatio) * EmissionFactors.ELECTRICITY_KG_PER_KWH;
            upsert(company, "BUSINESS_ELECTRICITY", month,
                    BigDecimal.valueOf(usageKwh), "kWh",
                    null, null, null, null, null, null, null, null, null, null,
                    co2e, null, "excel_upload");
            saved++;
        }
        return saved;
    }

    // ── Sheet 2: 고정 연소 ────────────────────────────────────────────────
    private int processStationary(Workbook wb, Company company, List<RowError> errors) {
        Sheet sheet = wb.getSheet("고정 연소");
        if (sheet == null) return 0;

        Map<String, Integer> cols = readHeader(sheet);
        int saved = 0;
        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (isBlankRow(row) || isNoteRow(row)) continue;

            String fuelType  = getString(row, cols, "fuel_type");
            Double amount    = getDouble(row, cols, "amount");
            String unit      = getString(row, cols, "unit");
            String purpose   = getString(row, cols, "usage_purpose");
            String month     = getString(row, cols, "billing_month");

            if (!validateRequired("고정 연소", r, "fuel_type", fuelType, errors)) continue;
            if (!validateRequired("고정 연소", r, "amount", amount, errors)) continue;
            if (!validateRequired("고정 연소", r, "unit", unit, errors)) continue;
            if (!validateBillingMonth("고정 연소", r, month, errors)) continue;
            if (!FUEL_TYPES.contains(fuelType)) { errors.add(err("고정 연소", r, "fuel_type", "허용되지 않는 연료 종류: " + fuelType)); continue; }
            if (amount < 0) { errors.add(err("고정 연소", r, "amount", "음수값 입력")); continue; }

            double co2e = calcStationaryCo2e(fuelType, amount, unit);
            upsert(company, "BUSINESS_STATIONARY_COMBUSTION", month,
                    BigDecimal.valueOf(amount), unit,
                    fuelType, purpose, null, null, null, null, null, null, null, null,
                    co2e, null, "excel_upload");
            saved++;
        }
        return saved;
    }

    // ── Sheet 3: 이동 연소 - 차량 ────────────────────────────────────────
    private int processMobileVehicle(Workbook wb, Company company, List<RowError> errors) {
        Sheet sheet = wb.getSheet("이동 연소-차량");
        if (sheet == null) sheet = wb.getSheet("이동연소-차량");
        if (sheet == null) sheet = wb.getSheet("이동 연소 차량");
        if (sheet == null) return 0;

        Map<String, Integer> cols = readHeader(sheet);
        int saved = 0;
        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (isBlankRow(row) || isNoteRow(row)) continue;

            String vehicleType = getString(row, cols, "vehicle_type");
            String fuelType    = getString(row, cols, "fuel_type");
            Double distanceKm  = getDouble(row, cols, "distance_km");
            Double fuelUsed    = getDouble(row, cols, "fuel_used_l");
            String month       = getString(row, cols, "billing_month");

            if (!validateRequired("이동 연소(차량)", r, "vehicle_type", vehicleType, errors)) continue;
            if (!validateRequired("이동 연소(차량)", r, "fuel_type", fuelType, errors)) continue;
            if (!validateRequired("이동 연소(차량)", r, "distance_km", distanceKm, errors)) continue;
            if (!validateBillingMonth("이동 연소(차량)", r, month, errors)) continue;
            if (!VEHICLE_TYPES.contains(vehicleType)) { errors.add(err("이동 연소(차량)", r, "vehicle_type", "허용되지 않는 차량 종류: " + vehicleType)); continue; }
            if (!MOBILE_FUEL_TYPES.contains(fuelType)) { errors.add(err("이동 연소(차량)", r, "fuel_type", "허용되지 않는 연료 종류: " + fuelType)); continue; }

            double actualFuel = (fuelUsed != null && fuelUsed > 0)
                    ? fuelUsed
                    : distanceKm / EmissionFactors.DEFAULT_FUEL_EFFICIENCY.getOrDefault(vehicleType, 10.0);
            double co2e = actualFuel * mobileFuelFactor(fuelType);

            upsert(company, "BUSINESS_MOBILE_COMBUSTION", month,
                    BigDecimal.valueOf(distanceKm), "km",
                    fuelType, null, vehicleType, "차량 기준",
                    BigDecimal.valueOf(distanceKm), fuelUsed != null ? BigDecimal.valueOf(fuelUsed) : null,
                    null, null, null, null, co2e, null, "excel_upload");
            saved++;
        }
        return saved;
    }

    // ── Sheet 4: 이동 연소 - 물류 ────────────────────────────────────────
    private int processMobileLogistics(Workbook wb, Company company, List<RowError> errors) {
        Sheet sheet = wb.getSheet("이동 연소-물류");
        if (sheet == null) sheet = wb.getSheet("이동연소-물류");
        if (sheet == null) sheet = wb.getSheet("이동 연소 물류");
        if (sheet == null) return 0;

        Map<String, Integer> cols = readHeader(sheet);
        int saved = 0;
        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (isBlankRow(row) || isNoteRow(row)) continue;

            String logisticsType = getString(row, cols, "logistics_type");
            Double distanceKm    = getDouble(row, cols, "distance_km");
            String month         = getString(row, cols, "billing_month");

            if (!validateRequired("이동 연소(물류)", r, "logistics_type", logisticsType, errors)) continue;
            if (!validateRequired("이동 연소(물류)", r, "distance_km", distanceKm, errors)) continue;
            if (!validateBillingMonth("이동 연소(물류)", r, month, errors)) continue;
            if (!LOGISTICS_TYPES.contains(logisticsType)) { errors.add(err("이동 연소(물류)", r, "logistics_type", "허용되지 않는 물류 종류: " + logisticsType)); continue; }

            // 물류 배출계수: 택배/화물 ~0.1 kgCO2/ton·km (ton-km 기준, 거리만 있으면 단순 추정)
            double co2e = distanceKm * 0.1;
            upsert(company, "BUSINESS_MOBILE_COMBUSTION", month,
                    BigDecimal.valueOf(distanceKm), "km",
                    null, null, null, "물류 기준",
                    BigDecimal.valueOf(distanceKm), null,
                    null, null, null, null, co2e, null, "excel_upload");
            saved++;
        }
        return saved;
    }

    // ── Sheet 5: 공정 가스 ───────────────────────────────────────────────
    private static final Set<String> GAS_TYPES = Set.of("CO2", "CH4", "N2O", "HFCs", "PFCs", "SF6");

    private int processProcessGas(Workbook wb, Company company, List<RowError> errors) {
        Sheet sheet = wb.getSheet("공정 가스");
        if (sheet == null) return 0;

        Map<String, Integer> cols = readHeader(sheet);
        int saved = 0;
        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (isBlankRow(row) || isNoteRow(row)) continue;

            String gasType    = getString(row, cols, "gas_type");
            Double amount     = getDouble(row, cols, "amount");
            String unit       = getString(row, cols, "unit");
            String processType = getString(row, cols, "process_type");
            String month      = getString(row, cols, "billing_month");

            if (!validateRequired("공정 가스", r, "gas_type", gasType, errors)) continue;
            if (!validateRequired("공정 가스", r, "amount", amount, errors)) continue;
            if (!validateBillingMonth("공정 가스", r, month, errors)) continue;
            if (!GAS_TYPES.contains(gasType)) { errors.add(err("공정 가스", r, "gas_type", "허용되지 않는 가스 종류: " + gasType)); continue; }
            if (amount < 0) { errors.add(err("공정 가스", r, "amount", "음수값 입력")); continue; }

            double amountKg = "ton".equals(unit) ? amount * 1000 : amount; // ton→kg, 나머지 그대로
            double gwp = EmissionFactors.GWP.getOrDefault(gasType, 1.0);
            double co2e = amountKg * gwp;

            upsert(company, "BUSINESS_PROCESS_GAS", month,
                    BigDecimal.valueOf(amount), unit != null ? unit : "kg",
                    null, null, null, null, null, null,
                    gasType, processType, null, null,
                    co2e, null, "excel_upload");
            saved++;
        }
        return saved;
    }

    // ── Sheet 6: 폐기물 ───────────────────────────────────────────────────
    private int processWaste(Workbook wb, Company company, List<RowError> errors) {
        Sheet sheet = wb.getSheet("폐기물");
        if (sheet == null) return 0;

        Map<String, Integer> cols = readHeader(sheet);
        int saved = 0;
        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (isBlankRow(row) || isNoteRow(row)) continue;

            String wasteType      = getString(row, cols, "waste_type");
            Double amountKg       = getDouble(row, cols, "amount_kg");
            String disposalMethod = getString(row, cols, "disposal_method");
            String month          = getString(row, cols, "billing_month");

            if (!validateRequired("폐기물", r, "waste_type", wasteType, errors)) continue;
            if (!validateRequired("폐기물", r, "amount_kg", amountKg, errors)) continue;
            if (!validateRequired("폐기물", r, "disposal_method", disposalMethod, errors)) continue;
            if (!validateBillingMonth("폐기물", r, month, errors)) continue;
            if (!WASTE_TYPES.contains(wasteType)) { errors.add(err("폐기물", r, "waste_type", "허용되지 않는 폐기물 종류: " + wasteType)); continue; }
            if (!DISPOSAL_METHODS.contains(disposalMethod)) { errors.add(err("폐기물", r, "disposal_method", "허용되지 않는 처리 방식: " + disposalMethod)); continue; }
            if (amountKg < 0) { errors.add(err("폐기물", r, "amount_kg", "음수값 입력")); continue; }

            double factor = EmissionFactors.WASTE_FACTORS
                    .getOrDefault(wasteType, Map.of())
                    .getOrDefault(disposalMethod, EmissionFactors.WASTE_DEFAULT_FACTOR);
            double co2e = amountKg * factor;

            upsert(company, "BUSINESS_WASTE", month,
                    BigDecimal.valueOf(amountKg), "kg",
                    null, null, null, null, null, null, null, null,
                    wasteType, disposalMethod, co2e, null, "excel_upload");
            saved++;
        }
        return saved;
    }

    // ── Sheet 6: 용수 ─────────────────────────────────────────────────────
    private int processWater(Workbook wb, Company company, List<RowError> errors) {
        Sheet sheet = wb.getSheet("용수");
        if (sheet == null) return 0;

        Map<String, Integer> cols = readHeader(sheet);
        int saved = 0;
        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (isBlankRow(row) || isNoteRow(row)) continue;

            Double usageTon = getDouble(row, cols, "water_usage_ton");
            String month    = getString(row, cols, "billing_month");

            if (!validateRequired("용수", r, "water_usage_ton", usageTon, errors)) continue;
            if (!validateBillingMonth("용수", r, month, errors)) continue;
            if (usageTon < 0) { errors.add(err("용수", r, "water_usage_ton", "음수값 입력")); continue; }

            double co2e = usageTon * EmissionFactors.WATER_KG_PER_TON;
            upsert(company, "BUSINESS_WATER", month,
                    BigDecimal.valueOf(usageTon), "ton",
                    null, null, null, null, null, null, null, null, null, null,
                    co2e, null, "excel_upload");
            saved++;
        }
        return saved;
    }

    // ── UPSERT ────────────────────────────────────────────────────────────
    private void upsert(Company company, String type, String billingMonth,
                        BigDecimal amount, String unit,
                        String fuelType, String usagePurpose, String vehicleType, String mobileType,
                        BigDecimal distanceKm, BigDecimal fuelUsed,
                        String gasType, String processType,
                        String wasteType, String disposalMethod,
                        double co2eKgDouble, String purpose, String source) {

        // 동일 company + billingMonth + type 기존 레코드 삭제 후 재삽입
        List<CompanyActivity> existing = activityRepository
                .findByCompany_CompanyIdAndBillingMonth(company.getCompanyId(), billingMonth)
                .stream()
                .filter(a -> type.equals(a.getType()))
                .toList();
        activityRepository.deleteAll(existing);

        BigDecimal co2eKg = BigDecimal.valueOf(co2eKgDouble).setScale(4, RoundingMode.HALF_UP);
        BigDecimal costKrw = co2eKg.multiply(BigDecimal.valueOf(EmissionFactors.COMPANY_KRW_PER_KG))
                .setScale(2, RoundingMode.HALF_UP);

        activityRepository.save(CompanyActivity.builder()
                .company(company).type(type).billingMonth(billingMonth)
                .amount(amount).unit(unit)
                .fuelType(fuelType).usagePurpose(usagePurpose)
                .vehicleType(vehicleType).mobileType(mobileType)
                .distanceKm(distanceKm).fuelUsed(fuelUsed)
                .gasType(gasType).processType(processType)
                .wasteType(wasteType).disposalMethod(disposalMethod)
                .purpose(purpose)
                .memo(null).source(source)
                .co2eKg(co2eKg).costKrw(costKrw)
                .build());
    }

    // ── 탄소 계산 헬퍼 ──────────────────────────────────────────────────
    private double calcStationaryCo2e(String fuelType, double amount, String unit) {
        double factor = switch (fuelType) {
            case "LNG", "도시가스LNG", "도시가스(LNG)" -> EmissionFactors.LNG_KG_PER_NM3;
            case "경유"                               -> EmissionFactors.DIESEL_KG_PER_L;
            case "LPG", "도시가스LPG", "도시가스(LPG)" -> EmissionFactors.LPG_KG_PER_L;
            case "휘발유"                              -> EmissionFactors.GASOLINE_KG_PER_L;
            case "등유"                               -> EmissionFactors.KEROSENE_KG_PER_L;
            default -> 0;
        };
        // kg → L 근사 변환
        double normalizedAmount = "kg".equals(unit) ? amount / 0.84 : amount;
        return normalizedAmount * factor;
    }

    private double mobileFuelFactor(String fuelType) {
        return switch (fuelType) {
            case "경유" -> EmissionFactors.DIESEL_KG_PER_L;
            case "LPG"  -> EmissionFactors.LPG_KG_PER_L;
            default     -> EmissionFactors.GASOLINE_KG_PER_L;
        };
    }

    // ── 헬퍼: POI 셀 읽기 ────────────────────────────────────────────────
    private Map<String, Integer> readHeader(Sheet sheet) {
        Map<String, Integer> map = new HashMap<>();
        Row header = sheet.getRow(0);
        if (header == null) return map;
        for (Cell cell : header) {
            String name = getCellString(cell).trim().toLowerCase();
            map.put(name, cell.getColumnIndex());
        }
        return map;
    }

    private String getString(Row row, Map<String, Integer> cols, String key) {
        Integer idx = cols.get(key);
        if (idx == null || row == null) return null;
        Cell cell = row.getCell(idx);
        return cell == null ? null : getCellString(cell).trim();
    }

    private Double getDouble(Row row, Map<String, Integer> cols, String key) {
        Integer idx = cols.get(key);
        if (idx == null || row == null) return null;
        Cell cell = row.getCell(idx);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
        String s = getCellString(cell).trim();
        if (s.isEmpty()) return null;
        try { return Double.parseDouble(s); } catch (NumberFormatException e) { return null; }
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                yield d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield String.valueOf(cell.getNumericCellValue()); }
                catch (Exception e) { yield cell.getStringCellValue(); }
            }
            default -> "";
        };
    }

    /** 템플릿의 노트 행("※" 로 시작하는 설명 행) 스킵 */
    private boolean isNoteRow(Row row) {
        if (row == null) return false;
        Cell first = row.getCell(0);
        if (first == null) return false;
        return getCellString(first).trim().startsWith("※");
    }

    private boolean isBlankRow(Row row) {
        if (row == null) return true;
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK
                    && !getCellString(cell).isBlank()) return false;
        }
        return true;
    }

    // ── 검증 헬퍼 ────────────────────────────────────────────────────────
    private boolean validateRequired(String sheet, int row, String field, Object val, List<RowError> errors) {
        if (val == null || (val instanceof String s && s.isBlank())) {
            errors.add(err(sheet, row, field, "필수 필드 누락"));
            return false;
        }
        return true;
    }

    private boolean validateBillingMonth(String sheet, int row, String month, List<RowError> errors) {
        if (month == null || month.isBlank()) {
            errors.add(err(sheet, row, "billing_month", "필수 필드 누락"));
            return false;
        }
        if (!BILLING_MONTH_PATTERN.matcher(month).matches()) {
            errors.add(err(sheet, row, "billing_month", "형식 오류 (YYYY-MM 이어야 함)"));
            return false;
        }
        // 미래 월(당월 포함) 차단
        if (!YearMonth.parse(month).isBefore(YearMonth.now())) {
            errors.add(err(sheet, row, "billing_month", "미래 또는 당월 데이터는 입력 불가"));
            return false;
        }
        return true;
    }

    private RowError err(String sheet, int row, String field, String reason) {
        return RowError.builder().sheet(sheet).row(row + 1).field(field).reason(reason).build();
    }
}
