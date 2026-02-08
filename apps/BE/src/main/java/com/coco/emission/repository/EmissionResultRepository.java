package com.coco.emission.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import com.coco.emission.entity.EmissionResult;

public interface EmissionResultRepository 
 extends JpaRepository<EmissionResult, Long>{

    List<EmissionResult> findByUserIdOrderByDateAsc(Long userId);

}
