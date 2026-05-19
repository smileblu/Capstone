package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class ActivityPrefillResponse {
    /** 기존 데이터 존재 여부 */
    private boolean found;
    private String type;
    private String billingMonth;
    /** FE InputFormPage values 상태와 동일한 필드명 → 값 */
    private Map<String, Object> values;
}
