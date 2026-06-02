-- ============================================================
-- 중소기업 테스트 더미 데이터 (company_id = 1)
-- 업종: 금속/기계 제조업 중소기업 (50-100인)
-- 기간: 2025-05 ~ 2026-05 (13개월)
-- 이상치 설계:
--   - 2025-07: 여름 생산량 급증 + 냉방 (총 배출 322,155 kgCO2e) → AI IQR 탐지
--   - 2026-05: 신규 설비 가동 + 폐기물 처리 급증 (총 315,098 kgCO2e) → BE 130% 임계값 + AI IQR 탐지
--
-- 배출계수 (EmissionFactors.java 기준):
--   전기: 0.4173 kgCO2e/kWh
--   LNG:  2.176  kgCO2e/Nm3
--   경유: 2.581  kgCO2e/L
--   일반폐기물(소각): 0.44 kgCO2e/kg
--   용수: 0.288  kgCO2e/ton
-- ============================================================

USE coco;

-- 기존 데이터 삭제
DELETE FROM company_activity WHERE company_id = 1;

-- ── 2025-05 (정상, 총 183,582 kgCO2e) ──────────────────────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2025-05', 270000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 112671.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2025-05', 20000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 43520.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2025-05', 4500,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 11615.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2025-05', 28000,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 12320.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2025-05', 12000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3456.00,   NULL, NOW(6), NOW(6));

-- ── 2025-06 (정상, 총 187,288 kgCO2e) ──────────────────────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2025-06', 285000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 118931.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2025-06', 18000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 39168.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2025-06', 4800,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 12389.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2025-06', 30000,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 13200.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2025-06', 12500,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3600.00,   NULL, NOW(6), NOW(6));

-- ── 2025-07 [이상치1] 여름 생산량 급증+냉방 (총 322,155 kgCO2e) ─────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2025-07', 490000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 204477.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2025-07', 30000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 65280.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2025-07', 7500,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 19358.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2025-07', 62000,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 27280.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2025-07', 20000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 5760.00,   NULL, NOW(6), NOW(6));

-- ── 2025-08 (정상 회복, 총 182,183 kgCO2e) ─────────────────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2025-08', 280000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 116844.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2025-08', 17000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 36992.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2025-08', 4700,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 12131.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2025-08', 29000,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 12760.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2025-08', 12000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3456.00,   NULL, NOW(6), NOW(6));

-- ── 2025-09 (정상, 총 181,664 kgCO2e) ──────────────────────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2025-09', 270000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 112671.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2025-09', 19000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 41344.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2025-09', 4600,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 11873.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2025-09', 28000,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 12320.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2025-09', 12000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3456.00,   NULL, NOW(6), NOW(6));

-- ── 2025-10 (정상, 가을 생산 재개, 총 200,213 kgCO2e) ──────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2025-10', 280000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 116844.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2025-10', 25000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 54400.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2025-10', 4800,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 12389.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2025-10', 29500,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 12980.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2025-10', 12500,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3600.00,   NULL, NOW(6), NOW(6));

-- ── 2025-11 (정상, 겨울 난방 시작, 총 220,498 kgCO2e) ──────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2025-11', 290000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 121017.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2025-11', 32000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 69632.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2025-11', 5000,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 12905.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2025-11', 30000,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 13200.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2025-11', 13000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3744.00,   NULL, NOW(6), NOW(6));

-- ── 2025-12 (정상, 겨울 최고 난방, 총 230,069 kgCO2e) ──────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2025-12', 295000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 123104.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2025-12', 35000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 76160.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2025-12', 5200,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 13421.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2025-12', 31000,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 13640.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2025-12', 13000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3744.00,   NULL, NOW(6), NOW(6));

-- ── 2026-01 (정상, 한파 난방 최대, 총 239,477 kgCO2e) ──────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2026-01', 300000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 125190.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2026-01', 38000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 82688.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2026-01', 5400,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 13937.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2026-01', 31500,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 13860.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2026-01', 13200,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3802.00,   NULL, NOW(6), NOW(6));

-- ── 2026-02 (정상, 총 223,242 kgCO2e) ──────────────────────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2026-02', 285000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 118931.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2026-02', 34000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 73984.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2026-02', 5100,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 13163.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2026-02', 30500,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 13420.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2026-02', 13000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3744.00,   NULL, NOW(6), NOW(6));

-- ── 2026-03 (정상, 봄 감소 시작, 총 188,670 kgCO2e) ───────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2026-03', 270000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 112671.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2026-03', 22000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 47872.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2026-03', 4700,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 12131.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2026-03', 28500,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 12540.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2026-03', 12000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3456.00,   NULL, NOW(6), NOW(6));

-- ── 2026-04 (정상, 봄 저점, 총 176,780 kgCO2e) ─────────────────────────────
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2026-04', 265000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 110585.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2026-04', 18000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 39168.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2026-04', 4500,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 11615.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2026-04', 27500,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 12100.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2026-04', 11500,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 3312.00,   NULL, NOW(6), NOW(6));

-- ── 2026-05 [이상치2] 신규 설비 가동+폐기물 급증 (총 315,098 kgCO2e) ─────────
-- BE 130% 임계값 초과 (6개월 평균 228,889 × 1.3 = 297,556 → 315,098 초과)
-- AI IQR 탐지 (상한 312,608 초과)
INSERT INTO company_activity (company_id, type, billing_month, amount, unit, fuel_type, usage_purpose, vehicle_type, mobile_type, waste_type, disposal_method, purpose, source, co2e_kg, cost_krw, created_at, updated_at) VALUES
(1, 'BUSINESS_ELECTRICITY',            '2026-05', 470000, 'kWh', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 196131.00, NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_STATIONARY_COMBUSTION',  '2026-05', 30000,  'Nm3', 'LNG',   '공정열', NULL,   NULL,      NULL,   NULL,   NULL,         'manual', 65280.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_MOBILE_COMBUSTION',      '2026-05', 7200,   'L',   'diesel', NULL,  '화물차', '연료 기준', NULL,   NULL,   NULL,         'manual', 18583.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WASTE',                  '2026-05', 68000,  'kg',  NULL,    NULL,   NULL,   NULL,      '일반',  '소각',  NULL,         'manual', 29920.00,  NULL, NOW(6), NOW(6)),
(1, 'BUSINESS_WATER',                  '2026-05', 18000,  'ton', NULL,    NULL,   NULL,   NULL,      NULL,   NULL,   '생산공정용수',  'manual', 5184.00,   NULL, NOW(6), NOW(6));

-- 결과 확인
SELECT billing_month,
       ROUND(SUM(co2e_kg) / 1000, 2) AS total_tco2e,
       COUNT(*) AS activity_count
FROM company_activity
WHERE company_id = 1
GROUP BY billing_month
ORDER BY billing_month;
