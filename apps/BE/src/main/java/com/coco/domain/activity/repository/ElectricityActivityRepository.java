package com.coco.domain.activity.repository;

import com.coco.domain.activity.entity.electricity.ElectricityActivity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ElectricityActivityRepository extends JpaRepository<ElectricityActivity, Long> {
}
