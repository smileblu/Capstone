package com.coco.domain.reward.repository;

import com.coco.domain.reward.entity.PointLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointLogRepository extends JpaRepository<PointLog, Long> {
    List<PointLog> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
}

