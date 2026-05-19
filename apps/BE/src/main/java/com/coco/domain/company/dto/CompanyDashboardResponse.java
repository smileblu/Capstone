package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CompanyDashboardResponse {

    /** 당월 총 탄소 배출량 (tCO₂e, 소수점 2자리) */
    private double totalEmission;

    /** 전월 대비 변화율 (%, 소수점 1자리. 전월 데이터 없으면 null) */
    private Double monthlyChange;

    /** Top 3 배출원 (이름 + 비율%) */
    private List<EmissionSource> emissionSources;

    /** 항목별 입력 완료 여부 */
    private List<InputStatus> inputItems;

    @Getter
    @Builder
    public static class EmissionSource {
        private String name;
        private int percent;
    }

    @Getter
    @Builder
    public static class InputStatus {
        private String name;
        private boolean done;
    }
}
