package com.coco.domain.analysis.repository;

import com.coco.domain.analysis.entity.Scenario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScenarioRepository extends JpaRepository<Scenario, Long> {
    List<Scenario> findByCategory(String category);
    List<Scenario> findByCategoryOrderByImpactKgDesc(String category);
    Optional<Scenario> findByScenarioId(String scenarioId);
}
