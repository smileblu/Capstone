package com.coco.onboarding.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coco.onboarding.entity.UserProfilePersonal;

public interface UserProfileRepository extends JpaRepository<UserProfilePersonal, Long> {
    
}
