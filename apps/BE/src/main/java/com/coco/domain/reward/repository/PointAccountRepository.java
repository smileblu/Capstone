package com.coco.domain.reward.repository;

import com.coco.domain.reward.entity.PointAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointAccountRepository extends JpaRepository<PointAccount, Long> {
}

