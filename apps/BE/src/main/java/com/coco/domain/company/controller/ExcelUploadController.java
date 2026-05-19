package com.coco.domain.company.controller;

import com.coco.domain.company.dto.ExcelUploadHistoryResponse;
import com.coco.domain.company.dto.ExcelUploadResponse;
import com.coco.domain.company.entity.ExcelUploadHistory;
import com.coco.domain.company.repository.CompanyRepository;
import com.coco.domain.company.repository.ExcelUploadHistoryRepository;
import com.coco.domain.company.service.ExcelTemplateService;
import com.coco.domain.company.service.ExcelUploadService;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.response.ApiResponse;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/company/activities")
public class ExcelUploadController {

    private final ExcelUploadService excelUploadService;
    private final ExcelTemplateService excelTemplateService;
    private final ExcelUploadHistoryRepository historyRepository;
    private final CompanyRepository companyRepository;

    // 카테고리별 파일명 매핑
    private static final Map<String, String> CATEGORY_FILE_NAMES = Map.of(
            "BUSINESS_ELECTRICITY",            "탄소배출_입력양식_전력.xlsx",
            "BUSINESS_STATIONARY_COMBUSTION",  "탄소배출_입력양식_고정연소.xlsx",
            "BUSINESS_MOBILE_COMBUSTION",      "탄소배출_입력양식_이동연소.xlsx",
            "BUSINESS_PROCESS_GAS",            "탄소배출_입력양식_공정가스.xlsx",
            "BUSINESS_WASTE",                  "탄소배출_입력양식_폐기물.xlsx",
            "BUSINESS_WATER",                  "탄소배출_입력양식_용수.xlsx"
    );

    /**
     * 카테고리별 샘플 엑셀 양식 다운로드.
     * GET /company/activities/upload/template?category=BUSINESS_STATIONARY_COMBUSTION
     * category 미지정 시 전체 시트 반환.
     */
    @GetMapping("/upload/template")
    public ResponseEntity<byte[]> downloadTemplate(
            @RequestParam(required = false) String category) {
        try {
            byte[] bytes = excelTemplateService.generateTemplate(category);
            String rawName = CATEGORY_FILE_NAMES.getOrDefault(category, "탄소배출_입력양식.xlsx");
            String fileName = URLEncoder.encode(rawName, StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + fileName)
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(bytes);
        } catch (IOException e) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 카테고리별 엑셀 업로드.
     * POST /company/activities/upload?category=BUSINESS_STATIONARY_COMBUSTION
     * category 미지정 시 전체 시트 처리.
     */
    @PostMapping("/upload")
    public ApiResponse<ExcelUploadResponse> uploadExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String category) {
        ExcelUploadResponse result = excelUploadService.upload(file, category);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, result);
    }

    /**
     * 카테고리별 업로드 이력 조회 (최근 5건).
     * GET /company/activities/excel/history?category=BUSINESS_ELECTRICITY
     */
    @GetMapping("/excel/history")
    public ApiResponse<ExcelUploadHistoryResponse> getHistory(
            @RequestParam(required = false) String category) {
        Long userId = SecurityUtil.getCurrentUserId();
        Long companyId = companyRepository.findByUser_UserId(userId)
                .map(c -> c.getCompanyId())
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        String cat = (category != null && !category.isBlank()) ? category : "ALL";
        List<ExcelUploadHistory> histories =
                historyRepository.findTop5ByCompany_CompanyIdAndCategoryOrderByCreatedAtDesc(companyId, cat);

        List<ExcelUploadHistoryResponse.HistoryItem> items = histories.stream()
                .map(ExcelUploadHistoryResponse.HistoryItem::from)
                .toList();

        return ApiResponse.onSuccess(GeneralSuccessCode.OK,
                ExcelUploadHistoryResponse.builder().history(items).build());
    }
}
