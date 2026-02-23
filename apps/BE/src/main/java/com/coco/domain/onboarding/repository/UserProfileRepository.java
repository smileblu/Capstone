package com.coco.domain.onboarding.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coco.domain.onboarding.entity.UserProfilePersonal;

public interface UserProfileRepository extends JpaRepository<UserProfilePersonal, Long> {

}