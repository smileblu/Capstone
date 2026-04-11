-- =============================================================
-- COCO 데모용 과거 더미 데이터 삽입 스크립트
-- 실행 전: 회원가입 + 온보딩이 완료된 상태여야 함
-- 이메일을 실제 데모 계정 이메일로 변경 후 실행
-- =============================================================

SET @user_id = (SELECT user_id FROM users WHERE email = 'demo@coco.com');

-- user_id 확인 (NULL이면 이메일 틀린 것 → 중단하고 이메일 수정)
SELECT @user_id AS user_id_check;



-- =============================================================
-- 3주 전 (2026-03-20 ~ 03-23) -- 3/17~19는 기존 데이터 있음
-- =============================================================

-- [3주 전] 교통: 지하철 12km
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-20', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

-- [3주 전] 소비: 음식 1회
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-21', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- [3주 전] 교통: 버스 8.5km
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-23', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 8.5, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.85, 68);

-- =============================================================
-- 2주 전 (2026-03-24 ~ 03-30)
-- =============================================================

-- [2주 전] 교통: 지하철 12km
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-24', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

-- [2주 전] 소비: 음식 1회
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-25', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- [2주 전] 교통: 도보 (탄소 0)
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-26', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'WALK', 3.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

-- [2주 전] 소비: 음식 2회
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-27', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- [2주 전] 교통: 지하철 12km
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-28', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

-- =============================================================
-- 1주 전 (2026-03-31 ~ 04-06) + 4월 전기요금
-- =============================================================

-- [1주 전] 교통: 버스 10km
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-03-31', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 10.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 1.0, 80);

-- [1주 전] 소비: 음식 1회
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-04-01', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- [1주 전] 교통: 지하철 12km
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-04-02', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

-- [1주 전] 소비: 음식 2회
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-04-03', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- [1주 전] 교통: 도보 (탄소 0)
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-04-04', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'WALK', 3.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

-- [1주 전] 소비: 음식 1회
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-04-07', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- [4월] 전기 (48,000원 → 201.6 kg)
INSERT INTO activity (user_id, activity_date, category, input_method)
VALUES (@user_id, '2026-04-07', 'ELECTRICITY', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO electricity_activity (activity_id, bill_amount, usage_pattern, period_start, period_end)
VALUES (@act, 48000, 'HOME', '2026-04-01', '2026-04-30');
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 201.6, 16128);

-- =============================================================
-- 검증 쿼리 (삽입 확인용)
-- =============================================================
SELECT
    a.activity_date,
    a.category,
    a.input_method,
    er.total_emission AS emission_kg,
    er.money_won
FROM activity a
JOIN emission_result er ON er.activity_id = a.id
WHERE a.user_id = @user_id
ORDER BY a.activity_date;
