## Activity API 명세 (프론트 전달용)

### 공통
- **Base**: `/activities`
- **Content-Type**: `application/json`
- **탄소 금액 환산 기준**: `1kg CO2 = 80원`

---

### 1) 소비 입력
- **POST** `/activities/consumption`
- **요청 Body**

```json
{
  "userId": 1,
  "category": "FOOD",
  "count": 2,
  "isOcr": false,
  "receiptImageUrl": null
}
```

- **동작**
  - 같은 **userId + 같은 날짜(오늘) + 같은 category(FOOD 등)** 이 이미 있으면 `count`를 누적(합산)하고 배출량/금액을 갱신합니다.
  - 없으면 새 Activity/ConsumptionActivity/EmissionResult를 생성합니다.
- **응답**
  - 현재는 기존 프론트 호환을 위해 `200 OK` + Body 없음(`Void`) 유지.

---

### 2) 교통 입력
- **POST** `/activities/transport`

#### (A) 직접 입력
```json
{
  "userId": 1,
  "transportMode": "BUS",
  "distanceKm": 5.2,
  "routeId": null
}
```

#### (B) 온보딩 저장 경로 선택
```json
{
  "userId": 1,
  "transportMode": null,
  "distanceKm": null,
  "routeId": "3"
}
```

- **동작**
  - `routeId`가 있으면 `RouteRepository`에서 해당 유저 소유 경로를 조회하고, 그 경로의 `defaultMode` + `distanceKm(없으면 좌표로 계산)`로 배출량을 계산합니다.
  - `routeId`가 없으면 요청의 `transportMode/distanceKm`로 계산합니다.
- **응답**
  - 기존 프론트 호환을 위해 `200 OK` + Body 없음(`Void`) 유지.

---

### 3) 전기료 입력 (월 1회 정책)
- **POST** `/activities/electricity`
- **요청 Body** (periodStart/periodEnd는 받되, **중복 판단은 timestamp(activityDate) 기준**)

```json
{
  "userId": 1,
  "billAmount": 50000,
  "usagePattern": "HOME",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-31"
}
```

- **동작**
  - 해당 유저의 **이번 달(Activity.activityDate 기준) 전기 입력이 이미 있으면** 새로 만들지 않고 기존 값을 갱신합니다.
  - 이번 달 입력이 없으면 새 Activity/ElectricityActivity/EmissionResult를 생성합니다.
- **응답**
  - 기존 프론트 호환을 위해 `200 OK` + Body 없음(`Void`) 유지.

---

### 4) 오늘 기록 요약 (배출량 + 금액)
- **GET** `/activities/summary/today?userId={userId}`
- **응답 (ApiResponse)**

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

- **요약 기준**
  - **교통/소비**: `activityDate = 오늘`인 활동들의 배출량 합
  - **전기**: 이번 달 입력이 있으면 그 값, 없으면 온보딩의 `UserProfilePersonal.electricityBill`을 기본값으로 배출량을 계산하여 반환

