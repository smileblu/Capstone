package com.coco.domain.activity.entity.emission;
import com.coco.domain.activity.entity.Activity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder

public class EmissionResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "activity_id", unique = true)
    private Activity activity;

    private Double totalEmission;

    /**
     * 탄소배출량 금전 환산 (원).
     * 기준: 1kg CO2 = 80원
     */
    private Long moneyWon;

    /** 배출량 재계산 시 갱신용 (Consumption 합산 등). */
    public void setTotalEmission(Double totalEmission) {
        this.totalEmission = totalEmission;
    }

    public void setMoneyWon(Long moneyWon) {
        this.moneyWon = moneyWon;
    }
}
