-- ============================================================
-- report_snapshot 테이블 DDL
-- company_id FK는 company 테이블의 company_id(PK) 참조
-- Spring JPA ddl-auto: update 환경에서는 Entity가 자동 생성하므로
-- 이 파일은 수동 확인/실행용
-- ============================================================

CREATE TABLE IF NOT EXISTS report_snapshot (
  id                BIGINT        AUTO_INCREMENT PRIMARY KEY,
  company_id        BIGINT        NOT NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  report_period     VARCHAR(30)   NOT NULL,
  k_ets_price_per_ton INT         NOT NULL,
  scope1_total_kg   DOUBLE        NOT NULL,
  scope2_total_kg   DOUBLE        NOT NULL,
  scope3_total_kg   DOUBLE        NOT NULL,
  grand_total_kg    DOUBLE        NOT NULL,
  cost_total_krw    BIGINT        NOT NULL,
  baseline_forecast JSON,
  scenario_a_json   JSON,
  scenario_b_json   JSON,
  scenario_c_json   JSON,
  file_path         VARCHAR(500),
  file_size_bytes   BIGINT,
  FOREIGN KEY (company_id) REFERENCES company(company_id)
);

-- 결과 확인
SELECT COUNT(*) AS report_count FROM report_snapshot;
