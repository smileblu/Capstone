package com.coco.domain.analysis.entity;

import com.coco.domain.analysis.repository.ScenarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ScenarioDataInitializer implements ApplicationRunner {

    private final ScenarioRepository scenarioRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (scenarioRepository.count() > 0) return;

        scenarioRepository.saveAll(List.of(
            // ── 교통 (TRANSPORT) ──────────────────────────────
            Scenario.builder().scenarioId("t1").category("TRANSPORT")
                .title("대중교통 이용 확대").subtitle("주 3일 대중교통 이용")
                .impactKg(4.5).impactWon(650).difficulty("중").build(),
            Scenario.builder().scenarioId("t2").category("TRANSPORT")
                .title("친환경 이동수단 전환").subtitle("자전거·도보 이동 늘리기")
                .impactKg(2.1).impactWon(0).difficulty("하").build(),
            Scenario.builder().scenarioId("t3").category("TRANSPORT")
                .title("카풀 이용하기").subtitle("동료·이웃과 카풀 실천")
                .impactKg(3.2).impactWon(1200).difficulty("중").build(),
            Scenario.builder().scenarioId("t4").category("TRANSPORT")
                .title("단거리 이동 도보화").subtitle("1km 이내 이동은 걷기")
                .impactKg(1.5).impactWon(0).difficulty("하").build(),
            Scenario.builder().scenarioId("t5").category("TRANSPORT")
                .title("전기차·하이브리드 고려").subtitle("친환경 차량으로 전환")
                .impactKg(8.0).impactWon(2000).difficulty("상").build(),

            // ── 전기 (ELECTRICITY) ────────────────────────────
            Scenario.builder().scenarioId("e1").category("ELECTRICITY")
                .title("대기전력 차단").subtitle("사용하지 않는 플러그 뽑기")
                .impactKg(1.3).impactWon(900).difficulty("하").build(),
            Scenario.builder().scenarioId("e2").category("ELECTRICITY")
                .title("LED 조명으로 교체").subtitle("고효율 LED 전구 사용")
                .impactKg(2.0).impactWon(1500).difficulty("중").build(),
            Scenario.builder().scenarioId("e3").category("ELECTRICITY")
                .title("냉난방 온도 조절").subtitle("여름 26℃·겨울 20℃ 유지")
                .impactKg(3.5).impactWon(2000).difficulty("하").build(),
            Scenario.builder().scenarioId("e4").category("ELECTRICITY")
                .title("고효율 가전 사용").subtitle("에너지 효율 1등급 가전 선택")
                .impactKg(5.0).impactWon(3000).difficulty("상").build(),

            // ── 소비 (CONSUMPTION) ────────────────────────────
            Scenario.builder().scenarioId("c1").category("CONSUMPTION")
                .title("배달 줄이기").subtitle("주 2회 배달 대신 직접 조리")
                .impactKg(3.0).impactWon(3000).difficulty("상").build(),
            Scenario.builder().scenarioId("c2").category("CONSUMPTION")
                .title("친환경 소비").subtitle("로컬 식품·포장재 줄이기")
                .impactKg(1.5).impactWon(500).difficulty("하").build(),
            Scenario.builder().scenarioId("c3").category("CONSUMPTION")
                .title("채식 식단 늘리기").subtitle("주 2~3회 채식 식단 실천")
                .impactKg(2.8).impactWon(1000).difficulty("중").build(),
            Scenario.builder().scenarioId("c4").category("CONSUMPTION")
                .title("중고 거래 활용").subtitle("새 제품 대신 중고 구매")
                .impactKg(2.0).impactWon(5000).difficulty("중").build(),

            // ── 공통 (COMMON) ─────────────────────────────────
            Scenario.builder().scenarioId("m1").category("COMMON")
                .title("일회용품 줄이기").subtitle("텀블러·장바구니 사용")
                .impactKg(0.8).impactWon(200).difficulty("하").build(),
            Scenario.builder().scenarioId("m2").category("COMMON")
                .title("분리수거 철저히 하기").subtitle("올바른 재활용 분리배출 실천")
                .impactKg(0.6).impactWon(0).difficulty("하").build()
        ));
    }
}
