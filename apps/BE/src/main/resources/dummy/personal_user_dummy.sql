-- ============================================================
-- 개인 사용자 더미 데이터: kim@ewha.ac.kr
-- 기간: 2026-01-01 ~ 2026-06-02 (매일)
-- 항목:
--   TRANSPORT   — 지하철 10km/일  (배출 0.5 kg, 5원)
--   CONSUMPTION — 음식(FOOD) 3건/일 (배출 6.0 kg, 60원)
--   ELECTRICITY — 월 1회 (1일 입력), 월별 청구금액 상이
--
-- 배출 계산 기준 (ActivityService 동일):
--   transport  = distanceKm × 0.05 (subway)
--   consumption = count × 2.0 (FOOD)
--   electricity = (billAmount / 100 × 0.42) / periodDays
--   money_won   = round(emission × 10)  ← carbon.won-per-kg-co2=10
--
-- 실행 전 확인:
--   SELECT user_id FROM users WHERE email = 'kim@ewha.ac.kr';
-- ============================================================

-- 중복 실행 방지: 해당 기간 데이터 삭제
SET @uid = (SELECT user_id FROM users WHERE email = 'kim@ewha.ac.kr');

DELETE er FROM emission_result er
  JOIN activity a ON er.activity_id = a.id
  WHERE a.user_id = @uid
    AND a.activity_date BETWEEN '2026-01-01' AND '2026-06-02';

DELETE ta FROM transport_activity ta
  JOIN activity a ON ta.activity_id = a.id
  WHERE a.user_id = @uid
    AND a.activity_date BETWEEN '2026-01-01' AND '2026-06-02';

DELETE ca FROM consumption_activity ca
  JOIN activity a ON ca.activity_id = a.id
  WHERE a.user_id = @uid
    AND a.activity_date BETWEEN '2026-01-01' AND '2026-06-02';

DELETE ea FROM electricity_activity ea
  JOIN activity a ON ea.activity_id = a.id
  WHERE a.user_id = @uid
    AND a.activity_date BETWEEN '2026-01-01' AND '2026-06-02';

DELETE FROM activity
  WHERE user_id = @uid
    AND activity_date BETWEEN '2026-01-01' AND '2026-06-02';

-- ============================================================
-- 프로시저로 날짜 루프
-- ============================================================
DROP PROCEDURE IF EXISTS insert_personal_dummy;

DELIMITER //
CREATE PROCEDURE insert_personal_dummy()
BEGIN
    DECLARE v_date    DATE DEFAULT '2026-01-01';
    DECLARE v_end     DATE DEFAULT '2026-06-02';
    DECLARE v_act_id  BIGINT;
    DECLARE v_bill    INT;
    DECLARE v_days    INT;
    DECLARE v_elec_em DOUBLE;

    SET @uid = (SELECT user_id FROM users WHERE email = 'kim@ewha.ac.kr');

    WHILE v_date <= v_end DO

        -- ── TRANSPORT (지하철 10km) ────────────────────────────────
        INSERT INTO activity (user_id, activity_date, category, input_method)
        VALUES (@uid, v_date, 'TRANSPORT', 'MANUAL');
        SET v_act_id = LAST_INSERT_ID();

        INSERT INTO transport_activity (activity_id, transport_mode, distance_km,
                                        route_id, start_lat, start_lng, end_lat, end_lng, duration_min)
        VALUES (v_act_id, 'SUBWAY', 10.0, NULL, NULL, NULL, NULL, NULL, NULL);

        INSERT INTO emission_result (activity_id, total_emission, money_won)
        VALUES (v_act_id, 0.5, 5);

        -- ── CONSUMPTION (음식 3건) ─────────────────────────────────
        INSERT INTO activity (user_id, activity_date, category, input_method)
        VALUES (@uid, v_date, 'CONSUMPTION', 'MANUAL');
        SET v_act_id = LAST_INSERT_ID();

        INSERT INTO consumption_activity (activity_id, category, count, is_ocr, receipt_image_url)
        VALUES (v_act_id, 'FOOD', 3, 0, NULL);

        INSERT INTO emission_result (activity_id, total_emission, money_won)
        VALUES (v_act_id, 6.0, 60);

        -- ── ELECTRICITY (매월 1일 1회) ─────────────────────────────
        IF DAY(v_date) = 1 THEN
            SET v_bill = CASE MONTH(v_date)
                WHEN 1 THEN 50000
                WHEN 2 THEN 45000
                WHEN 3 THEN 47000
                WHEN 4 THEN 52000
                WHEN 5 THEN 55000
                WHEN 6 THEN 50000
                ELSE 50000
            END;
            -- 기간 일수 = 해당 월의 말일
            SET v_days = DAY(LAST_DAY(v_date));
            -- dailyEmission = (bill / 100 * 0.42) / days
            SET v_elec_em = ROUND((v_bill / 100.0 * 0.42) / v_days, 4);

            INSERT INTO activity (user_id, activity_date, category, input_method)
            VALUES (@uid, v_date, 'ELECTRICITY', 'MANUAL');
            SET v_act_id = LAST_INSERT_ID();

            INSERT INTO electricity_activity (activity_id, bill_amount, usage_pattern,
                                              period_start, period_end)
            VALUES (v_act_id, v_bill, 'HOME', v_date, LAST_DAY(v_date));

            INSERT INTO emission_result (activity_id, total_emission, money_won)
            VALUES (v_act_id, v_elec_em, ROUND(v_elec_em * 10));
        END IF;

        SET v_date = DATE_ADD(v_date, INTERVAL 1 DAY);
    END WHILE;
END//
DELIMITER ;

CALL insert_personal_dummy();
DROP PROCEDURE IF EXISTS insert_personal_dummy;

-- 확인 쿼리
-- SELECT category, COUNT(*) AS cnt, MIN(activity_date), MAX(activity_date)
-- FROM activity WHERE user_id = @uid
-- GROUP BY category;
