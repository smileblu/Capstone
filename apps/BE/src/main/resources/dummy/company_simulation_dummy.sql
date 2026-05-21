-- ============================================================
-- Company Simulation 더미 데이터 (7개월: 2025-09 ~ 2026-03)
-- ■ 4월(2026-04), 5월(2026-05) 제외 — 4월은 앱에서 직접 입력 예정
-- ■ 이상치 2개 포함:
--     2025-11 ↓ 공장 유지보수 가동 중단 (정상 대비 −37%)
--     2026-01 ↑ 폭한 + 생산 폭증 (정상 대비 +36%)
-- ■ 공정가스(BUSINESS_PROCESS_GAS) 포함 — Scope 1
--
-- 실행 전: company_id 확인
--   SELECT company_id, company_name FROM company;
-- ============================================================

SET @cid = 1;  -- ← 본인 company_id 로 변경

-- 중복 실행 방지
DELETE FROM company_activity
WHERE company_id = @cid
  AND source = 'manual'
  AND billing_month IN (
    '2025-09','2025-10','2025-11','2025-12',
    '2026-01','2026-02','2026-03'
  );

-- ── 2025-09 (147.3 tCO₂e — 가을, 정상) ─────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2025-09', 165000, 'kWh', 68854.5000,  826320.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2025-09',  24000, 'Nm3', 52224.0000,  626688.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2025-09',   8300, 'L',   21422.3000,  257067.60, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_PROCESS_GAS',           '2025-09',   3500, 'kg',   3500.0000,   52500.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2025-09',   2800, 'kg',   1120.0000,   13440.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2025-09',    710, 'ton',   204.4800,    2453.76, 'manual', NOW(), NOW());

-- ── 2025-10 (152.7 tCO₂e — 가을, 정상) ─────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2025-10', 168000, 'kWh', 70106.4000,  841344.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2025-10',  25500, 'Nm3', 55488.0000,  665856.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2025-10',   8500, 'L',   21938.5000,  263262.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_PROCESS_GAS',           '2025-10',   3800, 'kg',   3800.0000,   57000.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2025-10',   2900, 'kg',   1160.0000,   13920.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2025-10',    720, 'ton',   207.3600,    2488.32, 'manual', NOW(), NOW());

-- ── 2025-11 ★이상치LOW★ (99.1 tCO₂e — 공장 정기 유지보수 가동 중단) ──
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2025-11', 115000, 'kWh', 47989.5000,  575920.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2025-11',  16500, 'Nm3', 35904.0000,  430848.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2025-11',   5000, 'L',   12905.0000,  154860.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_PROCESS_GAS',           '2025-11',   1500, 'kg',   1500.0000,   22500.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2025-11',   1600, 'kg',    640.0000,    7680.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2025-11',    420, 'ton',   120.9600,    1451.52, 'manual', NOW(), NOW());

-- ── 2025-12 (167.7 tCO₂e — 겨울 난방, 정상 복구) ────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2025-12', 176000, 'kWh', 73444.8000,  881408.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2025-12',  31000, 'Nm3', 67456.0000,  809472.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2025-12',   8200, 'L',   21164.2000,  253970.40, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_PROCESS_GAS',           '2025-12',   4200, 'kg',   4200.0000,   63000.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2025-12',   3100, 'kg',   1240.0000,   14880.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2025-12',    760, 'ton',   218.8800,    2626.56, 'manual', NOW(), NOW());

-- ── 2026-01 ★이상치HIGH★ (227.8 tCO₂e — 기록적 폭한 + 연초 생산 폭증) ──
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-01', 210000, 'kWh', 87633.0000, 1051680.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-01',  45000, 'Nm3', 97920.0000, 1175040.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-01',  13000, 'L',   33553.0000,  402636.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_PROCESS_GAS',           '2026-01',   6800, 'kg',   6800.0000,  102000.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-01',   4000, 'kg',   1600.0000,   19200.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-01',   1000, 'ton',   288.0000,    3456.00, 'manual', NOW(), NOW());

-- ── 2026-02 (165.1 tCO₂e — 겨울 정상화) ─────────────────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-02', 175000, 'kWh', 73027.5000,  876400.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-02',  29500, 'Nm3', 64192.0000,  770304.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-02',   8700, 'L',   22454.7000,  269456.40, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_PROCESS_GAS',           '2026-02',   4000, 'kg',   4000.0000,   60000.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-02',   2950, 'kg',   1180.0000,   14160.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-02',    745, 'ton',   214.5600,    2574.72, 'manual', NOW(), NOW());

-- ── 2026-03 (158.9 tCO₂e — 봄 전환, 생산 정상 수준) ─────────
INSERT INTO company_activity
  (company_id, type, billing_month, amount, unit, co2e_kg, cost_krw, source, created_at, updated_at)
VALUES
  (@cid, 'BUSINESS_ELECTRICITY',           '2026-03', 175000, 'kWh', 73027.5000,  876400.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_STATIONARY_COMBUSTION', '2026-03',  26500, 'Nm3', 57664.0000,  691968.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_MOBILE_COMBUSTION',     '2026-03',   9000, 'L',   23229.0000,  278748.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_PROCESS_GAS',           '2026-03',   3600, 'kg',   3600.0000,   54000.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WASTE',                 '2026-03',   3000, 'kg',   1200.0000,   14400.00, 'manual', NOW(), NOW()),
  (@cid, 'BUSINESS_WATER',                 '2026-03',    780, 'ton',   224.6400,    2695.68, 'manual', NOW(), NOW());

-- ================================================================
-- 결과 확인
-- ================================================================
SELECT
  billing_month,
  ROUND(SUM(co2e_kg) / 1000, 2) AS total_tco2e,
  COUNT(*)                        AS row_count,
  CASE
    WHEN ROUND(SUM(co2e_kg) / 1000, 2) < 110 THEN '★ 이상치LOW'
    WHEN ROUND(SUM(co2e_kg) / 1000, 2) > 200 THEN '★ 이상치HIGH'
    ELSE '정상'
  END AS 비고
FROM company_activity
WHERE company_id = @cid
  AND billing_month BETWEEN '2025-09' AND '2026-03'
GROUP BY billing_month
ORDER BY billing_month;
