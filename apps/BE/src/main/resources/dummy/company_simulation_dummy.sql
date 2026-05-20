-- ============================================================
-- Company Simulation 더미 데이터 (8개월: 2025-10 ~ 2026-05)
-- 중소 제조업체 기준 현실적 배출량 시나리오
--
-- 실행 방법:
--   1) company_id 확인: SELECT company_id, company_name FROM company;
--   2) 아래 @cid 값을 본인 company_id로 변경
--   3) MySQL에서 스크립트 실행
--
-- 공유 방법:
--   git commit 후 push → 팀원이 pull 받아서 동일하게 실행
-- ============================================================

SET @cid = 1;  -- ← company_id로 변경

-- 중복 실행 방지 (기존 더미 데이터 삭제 후 재입력)
DELETE FROM company_activity
WHERE company_id = @cid
  AND source = 'manual'
  AND billing_month IN ('2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05');

-- ================================================================
-- 배출 계수 (기준값)
--   전기       : 0.4173 kgCO₂/kWh
--   고정연소    : 2.1760 kgCO₂/Nm³  (LNG)
--   이동연소    : 2.5810 kgCO₂/L    (경유)
--   폐기물      : 0.4000 kgCO₂/kg
--   용수        : 0.2880 kgCO₂/ton
--
-- 월별 특징:
--   10~11월 : 가을 → 평균 수준
--   12~01월 : 겨울 → 난방(고정연소) 증가 +15~20%
--   02월    : 겨울 막바지 → 소폭 감소
--   03~05월 : 봄 → 생산량 증가로 전기·이동연소 완만 상승
-- ================================================================

-- ── 2025-10 (148.9 tCO₂e) ───────────────────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2025-10', 168000, 'kWh', 70106.4000,  841344.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2025-10',  25500, 'Nm3', 55488.0000,  665856.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2025-10',   8500, 'L',   21938.5000,  263262.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2025-10',   2900, 'kg',   1160.0000,   13920.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2025-10',    720, 'ton',   207.3600,    2488.32, 'manual', NOW(), NOW());

-- ── 2025-11 (154.7 tCO₂e) ───────────────────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2025-11', 172000, 'kWh', 71775.6000,  861376.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2025-11',  27000, 'Nm3', 58752.0000,  705024.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2025-11',   8800, 'L',   22712.8000,  272553.60, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2025-11',   3000, 'kg',   1200.0000,   14400.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2025-11',    740, 'ton',   213.1200,    2557.44, 'manual', NOW(), NOW());

-- ── 2025-12 (163.6 tCO₂e, 겨울 난방 시작) ──────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2025-12', 176000, 'kWh', 73444.8000,  881408.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2025-12',  31000, 'Nm3', 67456.0000,  809472.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2025-12',   8200, 'L',   21164.2000,  253970.40, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2025-12',   3100, 'kg',   1240.0000,   14880.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2025-12',    760, 'ton',   218.8800,    2626.56, 'manual', NOW(), NOW());

-- ── 2026-01 (165.9 tCO₂e, 겨울 피크) ───────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-01', 178000, 'kWh', 74279.4000,  891424.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-01',  31500, 'Nm3', 68544.0000,  822528.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-01',   8400, 'L',   21680.4000,  260164.80, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-01',   3000, 'kg',   1200.0000,   14400.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-01',    750, 'ton',   216.0000,    2592.00, 'manual', NOW(), NOW());

-- ── 2026-02 (161.1 tCO₂e, 겨울 막바지) ─────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-02', 175000, 'kWh', 73027.5000,  876400.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-02',  29500, 'Nm3', 64192.0000,  770304.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-02',   8700, 'L',   22454.7000,  269456.40, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-02',   2950, 'kg',   1180.0000,   14160.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-02',    745, 'ton',   214.5600,    2574.72, 'manual', NOW(), NOW());

-- ── 2026-03 (162.1 tCO₂e, 봄 시작) ─────────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-03', 180000, 'kWh', 75114.0000,  901368.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-03',  28000, 'Nm3', 60928.0000,  731136.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-03',   9500, 'L',   24519.5000,  294234.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-03',   3200, 'kg',   1280.0000,   15360.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-03',    800, 'ton',   230.4000,    2764.80, 'manual', NOW(), NOW());

-- ── 2026-04 (168.1 tCO₂e, 생산 증가) ───────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-04', 185000, 'kWh', 77200.5000,  926406.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-04',  29000, 'Nm3', 63104.0000,  757248.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-04',  10200, 'L',   26326.2000,  315914.40, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-04',   3100, 'kg',   1240.0000,   14880.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-04',    820, 'ton',   236.1600,    2833.92, 'manual', NOW(), NOW());

-- ── 2026-05 (174.0 tCO₂e, 현재 달) ─────────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-05', 190000, 'kWh', 79287.0000,  951444.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-05',  30000, 'Nm3', 65280.0000,  783360.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-05',  10800, 'L',   27874.8000,  334497.60, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-05',   3300, 'kg',   1320.0000,   15840.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-05',    850, 'ton',   244.8000,    2937.60, 'manual', NOW(), NOW());

-- ================================================================
-- 결과 확인 (실행 후 이 쿼리로 월별 합산 확인)
-- ================================================================
SELECT
  billing_month,
  ROUND(SUM(co2e_kg) / 1000, 2) AS total_tco2e,
  COUNT(*)                        AS row_count
FROM company_activity
WHERE company_id = @cid
  AND billing_month BETWEEN '2025-10' AND '2026-05'
GROUP BY billing_month
ORDER BY billing_month;
