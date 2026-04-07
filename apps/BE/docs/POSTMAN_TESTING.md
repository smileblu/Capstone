## Postman으로 현재 동작 확인하기 (FE 수정 없이)

이 문서는 **FE 코드는 건드리지 않고** Postman으로 백엔드 동작만 확인할 수 있도록 작성했습니다.

### 전제
- 서버 실행: `apps/BE`에서 `./gradlew bootRun` (또는 IDE 실행)
- Base URL: `http://localhost:8080`
- 응답 래퍼: `ApiResponse` 기반 엔드포인트는 `{"isSuccess":..., "code":..., "message":..., "result":...}` 형태입니다.

---

## 1) Activity 입력 (이미 구현됨)

### 1-1. 소비 입력
`POST /activities/consumption`

Body 예시 (`raw` JSON):
```json
{
  "userId": 1,
  "category": "FOOD",
  "count": 2,
  "isOcr": false,
  "receiptImageUrl": null
}
```

동작:
- `userId` + `오늘 날짜` + `category`(예: FOOD)가 이미 있으면 `count`를 누적
- 새로이면 `Activity -> ConsumptionActivity -> EmissionResult` 생성
- 배출량과 금액은 저장 단계에서 같이 계산됨

---

### 1-2. 교통 입력
`POST /activities/transport`

#### (A) 직접 입력 (routeId 없음)
```json
{
  "userId": 1,
  "transportMode": "BUS",
  "distanceKm": 5.2,
  "routeId": null
}
```

#### (B) 온보딩 저장 경로 선택 (routeId 있음)
```json
{
  "userId": 1,
  "transportMode": null,
  "distanceKm": null,
  "routeId": "3"
}
```

동작:
- `routeId`가 있으면 온보딩에서 저장된 `Route`를 `RouteRepository`로 조회하고,
  - `Route.defaultMode`로 이동수단 결정
  - `Route.distanceKm`가 null이면 좌표 기반으로 거리 계산(Haversine)
- 이후 `TransportActivity -> EmissionResult` 생성/저장

---

### 1-3. 전기 입력 (월 1회 정책)
`POST /activities/electricity`

Body 예시:
```json
{
  "userId": 1,
  "billAmount": 50000,
  "usagePattern": "HOME",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-31"
}
```

동작:
- **중복 판단은 `periodStart/periodEnd`가 아니라 `Activity.activityDate(오늘)`의 월 기준**으로 처리됨
- 이번 달에 전기 입력이 한 번이라도 있으면
  - `Activity(이번 달 1건)`을 찾아서 `ElectricityActivity` 값만 갱신(update)
  - 새 Activity를 더 만들지 않음

---

## 2) 오늘의 기록 요약 (이미 구현됨)

`GET /activities/summary/today?userId=1`

동작:
- 교통/소비: `Activity.activityDate = 오늘`인 것들의 `EmissionResult` 합
- 전기:
  - 이번 달에 전기 입력 Activity가 있으면 그 `EmissionResult.totalEmission` 사용
  - 이번 달 전기 입력이 없으면 온보딩 기본값(`UserProfilePersonal.electricityBill`)으로 추정

응답(예시):
```json
{
  "isSuccess": true,
  "code": "SUCCESS200_1",
  "message": "요청이 성공적으로 처리되었습니다.",
  "result": {
    "transport": { "emissionKg": 1.04, "moneyWon": 83 },
    "consumption": { "emissionKg": 4.0, "moneyWon": 320 },
    "electricity": { "emissionKg": 210.0, "moneyWon": 16800 },
    "electricityFromOnboardingDefault": false
  },
  "errors": null
}
```

---

## 3) 분석/예측/리워드/AI용 API에 대해

이제 아래 AI/분석 API는 **Spring Controller 엔드포인트로 연결되었습니다.**
- `analysis/*` : 월 요약/추이/카테고리 비율/이상치 탐지
- `ai/forecast/*` : ARIMA 예측 실행/결과 조회/추천 시나리오(LLM 대신 현재는 계수 기반 baseline)

주의:
- `ai/*`는 내부적으로 `apps/BE/ai/ai_cli.py`를 호출합니다.
- Python 환경에 `numpy`, `statsmodels` 설치가 필요합니다.
  - `apps/BE/ai/requirements_ai.txt` 참고
- 서버 실행 디렉토리가 `apps/BE`가 아니면 `CARBON_AI_CLI_PATH` 환경변수를 설정해야 할 수 있습니다.

또한 AI 관련 로직은 아래 경로에 **standalone Python 모듈 + CLI** 형태로 구현되어 있습니다.
- `apps/BE/ai/carbon_ai/anomaly.py` (개인 rolling-window z-score 기반 이상치 탐지)
- `apps/BE/ai/carbon_ai/forecast.py` (ARIMA forecasting with model factory)
- `apps/BE/ai/ai_cli.py` (stdin JSON -> stdout JSON)

---

## 4) AI/분석 API Postman 테스트

### 4-1. 월 요약 (카테고리별 배출량 + 금전 환산)
`GET /analysis/summary/monthly?userId=1&year=2026&month=3`

예시 응답 형태:
```json
{
  "isSuccess": true,
  "code": "SUCCESS200_1",
  "result": {
    "transport": { "emissionKg": 0.0, "moneyWon": 0 },
    "consumption": { "emissionKg": 0.0, "moneyWon": 0 },
    "electricity": { "emissionKg": 0.0, "moneyWon": 0 },
    "total": { "emissionKg": 0.0, "moneyWon": 0 }
  }
}
```

### 4-2. 월별 추이 그래프용 시계열(월 단위)
`GET /analysis/trend/monthly?userId=1&rangeMonths=12`

### 4-3. 카테고리 비율
`GET /analysis/ratio/category?userId=1&year=2026&month=3`

### 4-4. 이상치 탐지(z-score) 결과
`GET /analysis/anomaly/outliers?userId=1&rangeMonths=10&windowSize=7`

- 반환 데이터에는 `state`, `zScore`, `mean`, `std`가 포함됩니다.
- `outlierCount`, `warningCount`도 함께 내려줍니다.
- 탐지 시계열은 `EmissionResult`가 아니라 원본 입력값 기준으로 구성됩니다.
  - transport: `TransportActivity.distanceKm`
  - consumption: `ConsumptionActivity.count`
  - electricity: `ElectricityActivity.billAmount`

---

### 4-5. 예측 실행 (ARIMA)
`POST /ai/forecast/run`

Body 예시:
```json
{
  "userId": 1,
  "historyMonths": 12,
  "horizonMonths": 3,
  "model": "arima",
  "useAnomalyAdjusted": true
}
```

예시 응답:
```json
{
  "isSuccess": true,
  "result": { "forecastId": 1, "status": "DONE" }
}
```

### 4-6. 예측 결과 조회
`GET /ai/forecast/result?forecastId=1`

### 4-7. 추천 시나리오 조회
`GET /ai/recommendations?forecastId=1`

현재 추천은 LLM 대신 “예측값에 계수 기반 감축률을 적용”한 baseline 입니다.
이 부분은 이후 LLM 연동으로 교체 가능합니다.

---

## 5) FE 연동 가이드 (프론트 코드는 수정하지 않음)

아래는 FE 화면 구성에 맞춘 “어떤 API를 어떤 타이밍에 호출하면 되는지” 매핑입니다.

### 5-1. 분석(AnalyzationPage) 화면
1. `GET /analysis/anomaly/outliers` 로 `outlierCount + warningCount` 값을 읽어 “주의 필요” 배지에 사용
2. `GET /analysis/trend/monthly` 로 월별 추이 그래프 데이터 로드
3. `GET /analysis/ratio/category` 로 카테고리별 비율 막대 데이터 로드

구현 팁:
- 개선 추세(예: -18%) 같은 값은 추가 계산 로직이 필요해서, 우선은 “추이 그래프 + 이상치 개수”부터 연결하는 것을 권장합니다.

### 5-2. 시나리오(ScenarioPage) 화면
1. 분석 버튼 클릭 시 `POST /ai/forecast/run` 실행
2. 응답의 `forecastId`를 프론트 상태로 저장한 뒤 시나리오 페이지로 이동
3. 시나리오 페이지에서 `GET /ai/recommendations?forecastId=...` 호출
4. 응답의 `recommendations[]`를 카드 UI에 그대로 매핑

---

## 6) 보상/미션(Reward) Postman 테스트

### 6-1. 미션 생성 (추천 시나리오 선택 기반)
`POST /missions/create-from-recommendations`

Body 예시:
```json
{
  "userId": 1,
  "forecastId": 1,
  "selectedScenarioIds": ["s1","s3"]
}
```

### 6-2. 미션 목록 조회
`GET /missions?userId=1&status=pending`

- status는 `pending|done|paid` 또는 생략 가능(생략 시 전체)

### 6-3. 미션 평가 (pending -> done)
`POST /missions/{missionId}/evaluate`

Body 예시:
```json
{ "userId": 1 }
```

### 6-4. 포인트 지급 (done -> paid)
`POST /missions/{missionId}/pay`

Body 예시:
```json
{ "userId": 1 }
```

### 6-5. 포인트 잔액
`GET /rewards/points/balance?userId=1`

### 6-6. 포인트 로그
`GET /rewards/points/logs?userId=1&limit=20`


원하시는 “AI를 백엔드 API로 붙이는” 단계에서는
- Spring에서 `ProcessBuilder`로 `ai_cli.py`를 호출하고
- 결과 JSON을 프론트가 받는 응답 포맷으로 변환하는 컨트롤러/서비스를 추가하면 됩니다.

