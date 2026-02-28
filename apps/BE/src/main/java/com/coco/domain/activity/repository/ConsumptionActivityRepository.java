package com.coco.domain.activity.repository;

import com.coco.domain.activity.entity.consumption.ConsumptionActivity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsumptionActivityRepository extends JpaRepository<ConsumptionActivity, Long> {
}
