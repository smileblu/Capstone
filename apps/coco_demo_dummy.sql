-- =============================================================
-- COCO 데모용 더미 데이터 (ARIMA 학습용, 최근 4주 중심)
-- 기간: 2026-04-01 ~ 2026-05-17
-- 대상: demo@coco.com
-- =============================================================

SET @uid = (SELECT user_id FROM users WHERE email = 'demo@coco.com');
SELECT @uid AS user_id_check;

-- =============================================================
-- 2026년 4월 초 (04-01 ~ 04-18) — 배경 데이터
-- =============================================================

-- 04-01
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-01', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-01', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-02
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-02', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-02', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 04-03
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-03', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 8.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.8, 64);

-- 04-04
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-04', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-04', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-05 (토) 자동차
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-05', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'CAR', 18.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 3.78, 302);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-05', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 04-06 (일) 도보
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-06', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'WALK', 4.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-06', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'GOODS', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 3.5, 280);

-- 04-07
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-07', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-07', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-07 전기요금 (3월분)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-07', 'ELECTRICITY', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO electricity_activity (activity_id, bill_amount, usage_pattern, period_start, period_end) VALUES (@act, 44000, 'HOME', '2026-03-01', '2026-03-31');
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 184.8, 14784);

-- 04-08
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-08', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-08', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 04-09
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-09', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 10.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 1.0, 80);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-09', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-10
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-10', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

-- 04-11
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-11', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-11', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-12 (토)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-12', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'CAR', 20.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.2, 336);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-12', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-12', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'GOODS', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 3.5, 280);

-- 04-13 (일)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-13', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'WALK', 5.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

-- 04-14
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-14', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-14', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-15
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-15', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-15', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 04-16
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-16', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 8.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.8, 64);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-16', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-17
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-17', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

-- 04-18
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-18', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-18', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- =============================================================
-- 최근 4주 (04-19 ~ 05-17) — 촘촘한 데이터
-- =============================================================

-- 04-19 (토)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-19', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-19', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-20 (일)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-20', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'WALK', 4.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-20', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'GOODS', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 3.5, 280);

-- 04-21
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-21', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-21', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 04-22
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-22', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 8.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.8, 64);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-22', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-23
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-23', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-23', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-24
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-24', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-24', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 04-25
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-25', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'CAR', 15.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 3.15, 252);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-25', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 04-26 (토)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-26', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'CAR', 20.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.2, 336);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-26', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-26', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'GOODS', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 7.0, 560);

-- 04-27 (일)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-27', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BIKE', 8.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-27', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-28
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-28', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-28', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-29
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-29', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-29', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 04-30
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-30', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 10.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 1.0, 80);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-30', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 04-30 전기요금 (4월분)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-04-30', 'ELECTRICITY', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO electricity_activity (activity_id, bill_amount, usage_pattern, period_start, period_end) VALUES (@act, 45000, 'HOME', '2026-04-01', '2026-04-30');
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 189.0, 15120);

-- 05-01
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-01', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-01', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-02
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-02', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-02', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 05-03 (토)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-03', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'CAR', 18.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 3.78, 302);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-03', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-03', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'GOODS', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 3.5, 280);

-- 05-04 (일)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-04', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'WALK', 5.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-04', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-05 (어린이날)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-05', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BIKE', 10.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-05', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 05-06
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-06', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-06', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-07
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-07', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-07', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 05-08
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-08', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 9.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.9, 72);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-08', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-09
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-09', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-09', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-10 (토)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-10', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'CAR', 15.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 3.15, 252);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-10', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-10', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'GOODS', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 7.0, 560);

-- 05-11 (일)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-11', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'WALK', 4.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.0, 0);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-11', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-12
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-12', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-12', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-13
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-13', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-13', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 05-14
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-14', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'BUS', 8.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.8, 64);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-14', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-15
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-15', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-15', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 2, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 4.0, 320);

-- 05-16
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-16', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-16', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- 05-17 (오늘)
INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-17', 'TRANSPORT', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO transport_activity (activity_id, transport_mode, distance_km, route_id) VALUES (@act, 'SUBWAY', 12.0, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 0.6, 48);

INSERT INTO activity (user_id, activity_date, category, input_method) VALUES (@uid, '2026-05-17', 'CONSUMPTION', 'MANUAL');
SET @act = LAST_INSERT_ID();
INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url) VALUES (@act, 'FOOD', 1, false, NULL);
INSERT INTO emission_result (activity_id, total_emission, money_won) VALUES (@act, 2.0, 160);

-- =============================================================
-- 검증 쿼리
-- =============================================================
SELECT
    a.activity_date,
    a.category,
    er.total_emission AS emission_kg,
    er.money_won
FROM activity a
JOIN emission_result er ON er.activity_id = a.id
WHERE a.user_id = @uid
  AND a.activity_date >= '2026-04-01'
ORDER BY a.activity_date;
