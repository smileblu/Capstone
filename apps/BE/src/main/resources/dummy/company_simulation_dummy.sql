-- ============================================================
-- Company Simulation 더미 데이터
-- 실행 전: company_id 확인 후 @cid 값 수정
--   SELECT company_id, company_name FROM company;
-- ============================================================

SET @cid = 1; -- 위에서 확인한 company_id로 변경

-- ── 2026-03 ──────────────────────────────────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-03', 180000, 'kWh', 75114.0000, 901368.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-03',  28000, 'Nm3', 60928.0000, 731136.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-03',   9500, 'L',   24519.5000, 294234.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-03',   3200, 'kg',   1280.0000,  15360.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-03',    800, 'ton',   230.4000,   2764.80, 'manual', NOW(), NOW());

-- ── 2026-04 ──────────────────────────────────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-04', 185000, 'kWh', 77200.5000, 926406.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-04',  29000, 'Nm3', 63104.0000, 757248.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-04',  10200, 'L',   26326.2000, 315914.40, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-04',   3100, 'kg',   1240.0000,  14880.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-04',    820, 'ton',   236.1600,   2833.92, 'manual', NOW(), NOW());

-- ── 2026-05 ──────────────────────────────────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-05', 190000, 'kWh', 79287.0000, 951444.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-05',  30000, 'Nm3', 65280.0000, 783360.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-05',  10800, 'L',   27874.8000, 334497.60, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-05',   3300, 'kg',   1320.0000,  15840.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-05',    850, 'ton',   244.8000,   2937.60, 'manual', NOW(), NOW());

-- ── 결과 확인 ─────────────────────────────────────────────────
SELECT
  billing_month,
  ROUND(SUM(co2e_kg) / 1000, 2) AS total_tco2e
FROM company_activity
WHERE company_id = @cid
  AND billing_month IN ('2026-03', '2026-04', '2026-05')
GROUP BY billing_month
ORDER BY billing_month;
