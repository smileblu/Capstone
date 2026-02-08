package com.coco.emission.entity;
// 일단 최소 필드만 해서, 탄소배출량 계산 이후 결과 저장할 때 사용 

import java.time.LocalDate;
import jakarta.persistence.Id;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

public class EmissionResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long emissionId;

    private Long userId;

    private LocalDate date;

    private Double emissionKgco2e;

	public LocalDate getDate() {
		// TODO Auto-generated method stub
		throw new UnsupportedOperationException("Unimplemented method 'getDate'");
	}

    public Double getEmissionKgco2e() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getEmissionKgco2e'");
    }

    // getter/setter
    
}
