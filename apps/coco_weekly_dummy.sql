DELETE er FROM emission_result er
                   INNER JOIN activity a ON a.id = er.activity_id
WHERE a.user_id = 6 AND a.category = 'ELECTRICITY';

DELETE ea FROM electricity_activity ea
                   INNER JOIN activity a ON a.id = ea.activity_id
WHERE a.user_id = 6 AND a.category = 'ELECTRICITY';

DELETE FROM activity
WHERE user_id = 6 AND category = 'ELECTRICITY';