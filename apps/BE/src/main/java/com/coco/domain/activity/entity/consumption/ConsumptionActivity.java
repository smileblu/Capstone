package com.coco.domain.activity.entity.consumption;
import com.coco.domain.activity.entity.Activity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder

public class ConsumptionActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "activity_id", unique = true)
    private Activity activity;

    private String category;

    private Integer count;

    private Boolean isOcr;

    private String receiptImageUrl;

    /** 하루 단위로 같은 분야(category) 입력 시 count 합산용. */
    public void addCount(int delta) {
        this.count = (this.count == null ? 0 : this.count) + delta;
    }
}
