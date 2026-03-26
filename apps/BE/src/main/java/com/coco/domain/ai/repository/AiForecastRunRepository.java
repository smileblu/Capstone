package com.coco.domain.ai.repository;

import com.coco.domain.ai.entity.AiForecastRun;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiForecastRunRepository extends JpaRepository<AiForecastRun, Long> {
}

