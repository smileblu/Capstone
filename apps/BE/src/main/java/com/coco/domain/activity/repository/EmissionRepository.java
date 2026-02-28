package com.coco.domain.activity.repository;

import com.coco.domain.activity.entity.emission.EmissionResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmissionRepository extends JpaRepository<EmissionResult, Long> {
}