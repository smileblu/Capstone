package com.coco.domain.company.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class ExcelTemplateService {

    private static final String BILLING_NOTE =
            "※ YYYY-MM 형식 텍스트로 입력 (예: 2026-04) — 날짜 형식 아님";

    /**
     * 카테고리에 맞는 단일 시트(또는 이동연소는 2시트) 템플릿 반환.
     * category == null 이면 전체 시트 반환.
     */
    public byte[] generateTemplate(String category) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            CellStyle header     = makeHeaderStyle(wb);
            CellStyle note       = makeNoteStyle(wb);
            CellStyle input      = makeInputStyle(wb);
            CellStyle textNote   = makeTextNoteStyle(wb);
            CellStyle textInput  = makeTextInputStyle(wb);

            if (category == null || category.isBlank()) {
                // 전체 시트
                buildAll(wb, header, note, input, textNote, textInput);
            } else {
                switch (category) {
                    case "BUSINESS_ELECTRICITY"           -> buildElectricity(wb, header, note, input, textNote, textInput);
                    case "BUSINESS_STATIONARY_COMBUSTION" -> buildStationary(wb, header, note, input, textNote, textInput);
                    case "BUSINESS_MOBILE_COMBUSTION"     -> {
                        buildMobileVehicle(wb, header, note, input, textNote, textInput);
                        buildMobileLogistics(wb, header, note, input, textNote, textInput);
                    }
                    case "BUSINESS_PROCESS_GAS"           -> buildProcessGas(wb, header, note, input, textNote, textInput);
                    case "BUSINESS_WASTE"                 -> buildWaste(wb, header, note, input, textNote, textInput);
                    case "BUSINESS_WATER"                 -> buildWater(wb, header, note, input, textNote, textInput);
                    default                               -> buildAll(wb, header, note, input, textNote, textInput);
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    private void buildAll(XSSFWorkbook wb, CellStyle header, CellStyle note,
                          CellStyle input, CellStyle textNote, CellStyle textInput) {
        buildElectricity(wb, header, note, input, textNote, textInput);
        buildStationary(wb, header, note, input, textNote, textInput);
        buildMobileVehicle(wb, header, note, input, textNote, textInput);
        buildMobileLogistics(wb, header, note, input, textNote, textInput);
        buildProcessGas(wb, header, note, input, textNote, textInput);
        buildWaste(wb, header, note, input, textNote, textInput);
        buildWater(wb, header, note, input, textNote, textInput);
    }

    // ── Sheet 정의 ────────────────────────────────────────────────────────

    private void buildElectricity(XSSFWorkbook wb, CellStyle header, CellStyle note,
                                  CellStyle input, CellStyle textNote, CellStyle textInput) {
        buildSheet(wb, "전력",
                new String[]{"usage_kwh", "billing_month", "business_type", "renewable_ratio"},
                new int[]{15, 22, 15, 18},
                new String[]{
                        "※ 전력 사용량 (숫자, kWh)",
                        BILLING_NOTE,
                        "※ 산업용 또는 일반용 (선택)",
                        "※ 재생에너지 비율 0~100 (선택)"},
                1, header, note, input, textNote, textInput);
    }

    private void buildStationary(XSSFWorkbook wb, CellStyle header, CellStyle note,
                                 CellStyle input, CellStyle textNote, CellStyle textInput) {
        buildSheet(wb, "고정 연소",
                new String[]{"fuel_type", "amount", "unit", "usage_purpose", "billing_month"},
                new int[]{22, 12, 10, 15, 22},
                new String[]{
                        "※ LNG / 도시가스LNG / 도시가스LPG / 경유 / 휘발유 / 등유 / LPG",
                        "※ 사용량 (숫자)",
                        "※ Nm3 / L / kg",
                        "※ 난방 / 생산 / 기타 (선택)",
                        BILLING_NOTE},
                4, header, note, input, textNote, textInput);
    }

    private void buildMobileVehicle(XSSFWorkbook wb, CellStyle header, CellStyle note,
                                    CellStyle input, CellStyle textNote, CellStyle textInput) {
        buildSheet(wb, "이동 연소-차량",
                new String[]{"vehicle_type", "fuel_type", "distance_km", "fuel_used_l", "billing_month"},
                new int[]{15, 12, 15, 18, 22},
                new String[]{
                        "※ 승용차 / 승합차 / 화물차",
                        "※ 휘발유 / 경유 / LPG",
                        "※ 이동 거리 (숫자, km)",
                        "※ 실제 연료 사용량 (L) — 입력 시 우선 적용 (선택)",
                        BILLING_NOTE},
                4, header, note, input, textNote, textInput);
    }

    private void buildMobileLogistics(XSSFWorkbook wb, CellStyle header, CellStyle note,
                                      CellStyle input, CellStyle textNote, CellStyle textInput) {
        buildSheet(wb, "이동 연소-물류",
                new String[]{"logistics_type", "distance_km", "weight_ton", "billing_month"},
                new int[]{15, 15, 12, 22},
                new String[]{
                        "※ 택배 / 화물 / 항공 / 선박",
                        "※ 운송 거리 (숫자, km)",
                        "※ 화물 무게 (ton) — 선택",
                        BILLING_NOTE},
                3, header, note, input, textNote, textInput);
    }

    private void buildProcessGas(XSSFWorkbook wb, CellStyle header, CellStyle note,
                                 CellStyle input, CellStyle textNote, CellStyle textInput) {
        buildSheet(wb, "공정 가스",
                new String[]{"gas_type", "amount", "unit", "process_type", "billing_month"},
                new int[]{15, 12, 10, 20, 22},
                new String[]{
                        "※ CO2 / CH4 / N2O / HFCs / PFCs / SF6",
                        "※ 사용량 (숫자)",
                        "※ kg / ton / m3",
                        "※ 생산 / 냉매 / 화학 공정 / 기타 (선택)",
                        BILLING_NOTE},
                4, header, note, input, textNote, textInput);
    }

    private void buildWaste(XSSFWorkbook wb, CellStyle header, CellStyle note,
                            CellStyle input, CellStyle textNote, CellStyle textInput) {
        buildSheet(wb, "폐기물",
                new String[]{"waste_type", "amount_kg", "disposal_method", "billing_month"},
                new int[]{15, 15, 15, 22},
                new String[]{
                        "※ 일반 / 플라스틱 / 폐유 / 음식물 / 기타",
                        "※ 폐기물량 (숫자, kg)",
                        "※ 소각 / 재활용 / 매립",
                        BILLING_NOTE},
                3, header, note, input, textNote, textInput);
    }

    private void buildWater(XSSFWorkbook wb, CellStyle header, CellStyle note,
                            CellStyle input, CellStyle textNote, CellStyle textInput) {
        buildSheet(wb, "용수",
                new String[]{"water_usage_ton", "wastewater_ton", "billing_month"},
                new int[]{18, 15, 22},
                new String[]{
                        "※ 용수 사용량 (숫자, ton)",
                        "※ 폐수 발생량 (ton) — 선택",
                        BILLING_NOTE},
                2, header, note, input, textNote, textInput);
    }

    // ── 공통 시트 빌드 ────────────────────────────────────────────────────

    private void buildSheet(XSSFWorkbook wb, String sheetName,
                            String[] headers, int[] colWidths, String[] notes,
                            int billingMonthCol,
                            CellStyle headerStyle, CellStyle noteStyle, CellStyle inputStyle,
                            CellStyle textNoteStyle, CellStyle textInputStyle) {
        Sheet s = wb.createSheet(sheetName);
        int colCount = headers.length;

        for (int i = 0; i < colWidths.length; i++) s.setColumnWidth(i, colWidths[i] * 256);

        // billing_month 열 전체 TEXT 서식 (기본값)
        s.setDefaultColumnStyle(billingMonthCol, textInputStyle);

        // 헤더 행 (Row 0)
        Row headerRow = s.createRow(0);
        for (int i = 0; i < colCount; i++) {
            Cell c = headerRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        // 노트 행 (Row 1)
        Row noteRow = s.createRow(1);
        noteRow.setHeightInPoints(24);
        for (int i = 0; i < colCount; i++) {
            Cell c = noteRow.createCell(i);
            c.setCellValue(notes[i]);
            c.setCellStyle(i == billingMonthCol ? textNoteStyle : noteStyle);
        }

        // 입력 행 (Row 2~6)
        for (int r = 2; r <= 6; r++) {
            Row row = s.createRow(r);
            row.setHeightInPoints(20);
            for (int i = 0; i < colCount; i++) {
                row.createCell(i).setCellStyle(i == billingMonthCol ? textInputStyle : inputStyle);
            }
        }
    }

    // ── 스타일 ────────────────────────────────────────────────────────────

    private CellStyle makeHeaderStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        f.setFontHeightInPoints((short) 11);
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private CellStyle makeNoteStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        f.setItalic(true);
        f.setFontHeightInPoints((short) 9);
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setBorderBottom(BorderStyle.HAIR);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private CellStyle makeInputStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setBorderBottom(BorderStyle.HAIR);
        s.setBorderRight(BorderStyle.HAIR);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private CellStyle makeTextNoteStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        s.cloneStyleFrom(makeNoteStyle(wb));
        s.setDataFormat(wb.createDataFormat().getFormat("@"));
        return s;
    }

    private CellStyle makeTextInputStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        s.cloneStyleFrom(makeInputStyle(wb));
        s.setDataFormat(wb.createDataFormat().getFormat("@"));
        return s;
    }
}
