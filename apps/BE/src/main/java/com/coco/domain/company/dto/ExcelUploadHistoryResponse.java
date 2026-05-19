package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Getter
@Builder
public class ExcelUploadHistoryResponse {
    private List<HistoryItem> history;

    @Getter
    @Builder
    public static class HistoryItem {
        private String uploadedAt;  // "YYYY.MM.DD HH:mm"
        private String fileName;
        private int savedCount;
        private int errorCount;

        private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");

        public static HistoryItem from(com.coco.domain.company.entity.ExcelUploadHistory h) {
            return HistoryItem.builder()
                    .uploadedAt(h.getCreatedAt() != null ? h.getCreatedAt().format(FMT) : "")
                    .fileName(h.getFileName())
                    .savedCount(h.getSavedCount())
                    .errorCount(h.getErrorCount())
                    .build();
        }
    }
}
