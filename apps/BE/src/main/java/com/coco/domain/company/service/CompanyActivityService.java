package com.coco.domain.company.service;

import com.coco.domain.company.config.EmissionFactors;
import com.coco.domain.company.dto.ActivityPrefillResponse;
import com.coco.domain.company.dto.CompanyActivityRequest;
import com.coco.domain.company.dto.CompanyActivityResponse;
import com.coco.domain.company.entity.Company;
import com.coco.domain.company.entity.CompanyActivity;
import com.coco.domain.company.repository.CompanyActivityRepository;
import com.coco.domain.company.repository.CompanyRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CompanyActivityService {

    private final CompanyRepository companyRepository;
    private final CompanyActivityRepository activityRepository;

    @Transactional
    public CompanyActivityResponse saveActivity(CompanyActivityRequest req) {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        String billingMonth = resolveBillingMonth(req.getBillingMonth());
        validateInputWindow(billingMonth);

        // 동일 company + billingMonth + type 기존 레코드 UPSERT (기존 삭제 후 재삽입)
        List<CompanyActivity> existing = activityRepository
                .findByCompany_CompanyIdAndBillingMonth(company.getCompanyId(), billingMonth)
                .stream()
                .filter(a -> req.getType().equals(a.getType()))
                .toList();
        activityRepository.deleteAll(existing);

        BigDecimal co2eKg = calculate(req);
        BigDecimal costKrw = co2eKg.multiply(BigDecimal.valueOf(EmissionFactors.COMPANY_KRW_PER_KG))
                .setScale(2, RoundingMode.HALF_UP);

        // 입력 수량 결정
        BigDecimal amount = resolveAmount(req);
        String unit = resolveUnit(req);

        CompanyActivity activity = CompanyActivity.builder()
                .company(company)
                .type(req.getType())
                .billingMonth(billingMonth)
                .amount(amount)
                .unit(unit)
                .fuelType(req.getFuelType())
                .usagePurpose(req.getUsagePurpose())
                .vehicleType(req.getVehicleType())
                .mobileType(req.getMobileType())
                .distanceKm(req.getDistanceKm())
                .fuelUsed(req.getFuelUsed())
                .gasType(req.getGasType())
                .processType(req.getProcessType())
                .wasteType(req.getWasteType())
                .disposalMethod(req.getDisposalMethod())
                .purpose(req.getPurpose())
                .memo(req.getMemo())
                .source(req.getMode() != null ? req.getMode() : "manual")
                .co2eKg(co2eKg)
                .costKrw(costKrw)
                .build();

        CompanyActivity saved = activityRepository.save(activity);

        return CompanyActivityResponse.builder()
                .id(saved.getId())
                .type(saved.getType())
                .billingMonth(saved.getBillingMonth())
                .co2eKg(saved.getCo2eKg())
                .costKrw(saved.getCostKrw())
                .build();
    }

    // ── 탄소 계산 ─────────────────────────────────────────────────────────────

    private BigDecimal calculate(CompanyActivityRequest req) {
        if (req.getType() == null) return BigDecimal.ZERO;
        return switch (req.getType()) {
            case "BUSINESS_ELECTRICITY"              -> calcElectricity(req);
            case "BUSINESS_STATIONARY_COMBUSTION"   -> calcStationaryCombustion(req);
            case "BUSINESS_MOBILE_COMBUSTION"       -> calcMobileCombustion(req);
            case "BUSINESS_PROCESS_GAS"             -> calcProcessGas(req);
            case "BUSINESS_WASTE"                   -> calcWaste(req);
            case "BUSINESS_WATER"                   -> calcWater(req);
            default -> BigDecimal.ZERO;
        };
    }

    /** 전기: kWh × 0.4173 */
    private BigDecimal calcElectricity(CompanyActivityRequest req) {
        if (req.getUsage() == null) return BigDecimal.ZERO;
        double kwh = toKwh(req.getUsage().doubleValue(), req.getUnit());
        return round4(kwh * EmissionFactors.ELECTRICITY_KG_PER_KWH);
    }

    /** 고정 연소: 연료별 배출계수 적용 */
    private BigDecimal calcStationaryCombustion(CompanyActivityRequest req) {
        if (req.getAmount() == null) return BigDecimal.ZERO;
        double factor = stationaryFactor(req.getFuelType(), req.getUnit());
        double amountNorm = normalizeStationaryUnit(req.getAmount().doubleValue(), req.getUnit(), req.getFuelType());
        return round4(amountNorm * factor);
    }

    /** 이동 연소: 연료 사용량 기반(우선) 또는 거리 기반 추정 */
    private BigDecimal calcMobileCombustion(CompanyActivityRequest req) {
        double fuelL;
        if (req.getFuelUsed() != null && req.getFuelUsed().doubleValue() > 0) {
            fuelL = req.getFuelUsed().doubleValue();
        } else {
            double km = req.getDistanceKm() != null ? req.getDistanceKm().doubleValue() : 0;
            double efficiency = EmissionFactors.DEFAULT_FUEL_EFFICIENCY
                    .getOrDefault(req.getVehicleType(), 10.0);
            fuelL = km / efficiency;
        }
        double factor = mobileFuelFactor(req.getFuelType());
        return round4(fuelL * factor);
    }

    /** 공정 가스: 양(kg) × GWP */
    private BigDecimal calcProcessGas(CompanyActivityRequest req) {
        if (req.getAmount() == null) return BigDecimal.ZERO;
        double amountKg = toKgFromUnit(req.getAmount().doubleValue(), req.getUnit());
        double gwp = EmissionFactors.GWP.getOrDefault(req.getGasType(), 1.0);
        return round4(amountKg * gwp);
    }

    /** 폐기물: 종류 × 처리 방식 계수 */
    private BigDecimal calcWaste(CompanyActivityRequest req) {
        if (req.getAmount() == null) return BigDecimal.ZERO;
        double amountKg = toKgFromUnit(req.getAmount().doubleValue(), req.getUnit());
        double factor = EmissionFactors.WASTE_FACTORS
                .getOrDefault(req.getWasteType(), java.util.Map.of())
                .getOrDefault(req.getDisposalMethod(), EmissionFactors.WASTE_DEFAULT_FACTOR);
        return round4(amountKg * factor);
    }

    /** 용수: ton × 0.288 */
    private BigDecimal calcWater(CompanyActivityRequest req) {
        if (req.getWaterUsage() == null) return BigDecimal.ZERO;
        double ton = toTonFromUnit(req.getWaterUsage().doubleValue(), req.getUnit());
        return round4(ton * EmissionFactors.WATER_KG_PER_TON);
    }

    // ── 단위 변환 헬퍼 ──────────────────────────────────────────────────────

    private double toKwh(double val, String unit) {
        if ("MWh".equals(unit)) return val * 1_000;
        if ("GWh".equals(unit)) return val * 1_000_000;
        return val; // kWh default
    }

    /** 고정 연소: 입력량을 배출계수 기준 단위로 변환한 뒤 계수 반환 */
    private double stationaryFactor(String fuelType, String unit) {
        if (fuelType == null) return 0;
        return switch (fuelType) {
            case "LNG", "도시가스(LNG)" -> EmissionFactors.LNG_KG_PER_NM3;  // per Nm3
            case "경유"                 -> EmissionFactors.DIESEL_KG_PER_L;  // per L
            case "LPG", "도시가스(LPG)" -> EmissionFactors.LPG_KG_PER_L;    // per L
            default                    -> 0;
        };
    }

    /** 고정 연소: 입력 단위를 기준 단위(Nm3 또는 L)로 환산 */
    private double normalizeStationaryUnit(double val, String unit, String fuelType) {
        if (unit == null) return val;
        // kg → L 변환 (경유 ~0.84 kg/L, LPG ~0.55 kg/L)
        if ("kg".equals(unit)) {
            if (fuelType != null && fuelType.contains("경유")) return val / 0.84;
            if (fuelType != null && fuelType.contains("LPG")) return val / 0.55;
        }
        // ton → Nm3 (LNG 1ton ≈ 1320 Nm3)
        if ("ton".equals(unit) && (fuelType != null && fuelType.contains("LNG"))) return val * 1320;
        return val; // Nm3 or L — no conversion needed
    }

    private double mobileFuelFactor(String fuelType) {
        if (fuelType == null) return EmissionFactors.GASOLINE_KG_PER_L;
        return switch (fuelType) {
            case "경유" -> EmissionFactors.DIESEL_KG_PER_L;
            case "등유" -> EmissionFactors.KEROSENE_KG_PER_L;
            case "LPG" -> EmissionFactors.LPG_KG_PER_L;
            default    -> EmissionFactors.GASOLINE_KG_PER_L; // 휘발유
        };
    }

    private double toKgFromUnit(double val, String unit) {
        if ("ton".equals(unit)) return val * 1000;
        if ("m3".equals(unit)) return val; // 1m3 ≈ 1kg for gas approximation
        return val; // kg
    }

    private double toTonFromUnit(double val, String unit) {
        if ("m3".equals(unit)) return val; // 1m3 = 1ton for water
        if ("L".equals(unit)) return val / 1000;
        return val; // ton
    }

    // ── 유틸리티 ───────────────────────────────────────────────────────────

    private static String resolveBillingMonth(String requested) {
        if (requested != null && !requested.isBlank()) return requested;
        return YearMonth.now().minusMonths(1).toString(); // YYYY-MM
    }

    /**
     * 입력 가능 기간 검증.
     * 입력 대상: 전월 데이터 (billingMonth = 현재 달 - 1)
     * 입력 가능 기간: 당월 1일 ~ 말일 (31일 전체, 하루도 제한 없음)
     *
     * 즉, billingMonth 가 "직전 달"인지만 확인.
     * 전전 달 이전이나 미래 달은 허용하지 않는다.
     */
    private static void validateInputWindow(String billingMonth) {
        String validMonth = YearMonth.now().minusMonths(1).toString();
        if (!validMonth.equals(billingMonth)) {
            throw new com.coco.global.error.exception.GeneralException(
                    com.coco.global.error.code.GeneralErrorCode.BAD_REQUEST);
        }
    }

    private BigDecimal resolveAmount(CompanyActivityRequest req) {
        if (req.getUsage() != null) return req.getUsage();
        if (req.getWaterUsage() != null) return req.getWaterUsage();
        if (req.getDistanceKm() != null) return req.getDistanceKm();
        return req.getAmount();
    }

    private String resolveUnit(CompanyActivityRequest req) {
        return req.getUnit() != null ? req.getUnit() : "";
    }

    private BigDecimal round4(double val) {
        return BigDecimal.valueOf(val).setScale(4, RoundingMode.HALF_UP);
    }

    // ── 직접 입력 이전값 조회 (pre-fill) ─────────────────────────────────
    @Transactional(readOnly = true)
    public ActivityPrefillResponse getPrefill(String type, String billingMonth) {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        String month = (billingMonth != null && !billingMonth.isBlank())
                ? billingMonth
                : YearMonth.now().minusMonths(1).toString();

        List<CompanyActivity> list = activityRepository
                .findByCompany_CompanyIdAndBillingMonth(company.getCompanyId(), month)
                .stream()
                .filter(a -> type.equals(a.getType()))
                .toList();

        if (list.isEmpty()) {
            return ActivityPrefillResponse.builder()
                    .found(false).type(type).billingMonth(month)
                    .values(Map.of()).build();
        }

        CompanyActivity a = list.get(0);
        Map<String, Object> values = new HashMap<>();

        switch (type) {
            case "BUSINESS_ELECTRICITY" -> {
                put(values, "usage", a.getAmount());
                put(values, "unit", a.getUnit());
            }
            case "BUSINESS_STATIONARY_COMBUSTION" -> {
                put(values, "fuelType", a.getFuelType());
                put(values, "amount", a.getAmount());
                put(values, "unit", a.getUnit());
                put(values, "usagePurpose", a.getUsagePurpose());
            }
            case "BUSINESS_MOBILE_COMBUSTION" -> {
                put(values, "mobileType", a.getMobileType());
                put(values, "vehicleType", a.getVehicleType());
                put(values, "fuelType", a.getFuelType());
                put(values, "distanceKm", a.getDistanceKm());
                put(values, "fuelUsed", a.getFuelUsed());
            }
            case "BUSINESS_PROCESS_GAS" -> {
                put(values, "gasType", a.getGasType());
                put(values, "amount", a.getAmount());
                put(values, "unit", a.getUnit());
                put(values, "processType", a.getProcessType());
            }
            case "BUSINESS_WASTE" -> {
                put(values, "wasteType", a.getWasteType());
                put(values, "amount", a.getAmount());
                put(values, "unit", a.getUnit());
                put(values, "disposalMethod", a.getDisposalMethod());
            }
            case "BUSINESS_WATER" -> {
                put(values, "waterUsage", a.getAmount());
                put(values, "unit", a.getUnit());
                put(values, "purpose", a.getPurpose());
            }
        }

        return ActivityPrefillResponse.builder()
                .found(true).type(type).billingMonth(month)
                .values(values).build();
    }

    private void put(Map<String, Object> map, String key, Object val) {
        if (val != null) map.put(key, val);
    }
}
