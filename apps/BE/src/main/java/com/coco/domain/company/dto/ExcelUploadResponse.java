package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ExcelUploadResponse {

    private boolean success;
    private int savedCount;
    private int errorCount;
    private List<RowError> errors;

    @Getter
    @Builder
    public static class RowError {
        private String sheet;   // 시트명 (예: "전력")
        private int row;        // 행 번호 (1-based, 헤더 제외)
        private String field;   // 필드명
        private String reason;  // 오류 사유
    }
}
