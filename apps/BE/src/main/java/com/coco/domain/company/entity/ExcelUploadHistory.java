package com.coco.domain.company.entity;

import com.coco.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ExcelUploadHistory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    /** 카테고리 (예: BUSINESS_ELECTRICITY) */
    private String category;

    /** 업로드된 파일명 */
    private String fileName;

    /** 저장 성공 건수 */
    private int savedCount;

    /** 오류 건수 */
    private int errorCount;
}
