## AI 모듈 구현 문서 (이상치 탐지/ARIMA 예측)

### 1) 이상치 탐지 (z-score / rolling window)

모듈: `apps/BE/ai/carbon_ai/anomaly.py`

핵심 규칙
- 개인별 최근 행동 패턴 기준
- history 길이가 `7` 미만이면 `insufficient_data`로 처리 (z-score 계산 생략)
- history의 최근 `7`개를 rolling window로 사용해 평균/표준편차 계산
- 표준편차가 `std_eps(기본 1e-6)` 이하이면 `stable`로 처리
- z-score 기준 상태 분류
  - `abs(z) > 2.5` : `outlier`
  - `abs(z) > 1.8` : `warning`
  - 그 외 : `normal`
- 물리적으로 비현실적인 값(예: 음수 distance 등)이면 `physical_invalid`로 처리

API (Python)
```python
from carbon_ai.anomaly import detect_anomaly_zscore

result = detect_anomaly_zscore(
  history=[...],     # 과거 값들 (current 제외)
  current=...,       # 새 값
  window_size=7,
  min_physical_value=0.0,
)
print(result.state, result.z_score, result.mean, result.std)
```

CLI로 실행 (stdin JSON)
```bash
echo '{
  "task":"anomaly",
  "params":{
    "history":[10,10.2,9.9,10.1,10.05,10.0,10.2],
    "current":13.0,
    "min_physical_value":0.0
  }
}' | python apps/BE/ai/ai_cli.py
```

---

### 2) ARIMA 시계열 예측 (모델 교체를 위한 확장 구조)

모듈: `apps/BE/ai/carbon_ai/forecast.py`

- 현재 구현: `arima` (기본 order=(1,1,1))
- `get_forecaster()` factory로 모델을 교체할 수 있도록 인터페이스를 분리

API (Python)
```python
from carbon_ai.forecast import get_forecaster

forecaster = get_forecaster("arima")  # 향후 prophet/lstm 추가 가능
res = forecaster.forecast(history=[...], horizon=3)
print(res.forecast)
```

CLI로 실행
```bash
echo '{
  "task":"forecast",
  "params":{
    "model":"arima",
    "history":[1.0,1.2,0.9,1.1,1.05,1.0,1.2],
    "horizon":3,
    "order":[1,1,1]
  }
}' | python apps/BE/ai/ai_cli.py
```

---

### 3) 다음 단계(연동)

현재 구현은 “AI 계산 모듈 + CLI”까지 포함합니다.
- 이후 Spring Boot에서 `ProcessBuilder`로 `ai_cli.py`를 호출
- DB에서 유저의 최근 7개 값(월별 배출량 등)을 추출해 `history`로 넘기면
  개인별 rolling window 이상치 탐지/ARIMA 예측 결과를 API로 제공할 수 있습니다.

