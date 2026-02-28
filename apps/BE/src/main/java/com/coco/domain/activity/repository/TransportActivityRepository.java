package com.coco.domain.activity.repository;

import com.coco.domain.activity.entity.transport.TransportActivity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportActivityRepository extends JpaRepository<TransportActivity, Long> {
}
