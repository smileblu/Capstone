from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import pandas as pd
from forecast import forecast_next_month

app = FastAPI()


class MonthlyPoint(BaseModel):
    date: str          # "YYYY-MM"
    emission_kg: float


class PredictRequest(BaseModel):
    data: List[MonthlyPoint]


class PredictResponse(BaseModel):
    predicted_kg: float


class UserProfile(BaseModel):
    top_transport_mode: str        # "CAR" | "BUS" | "SUBWAY" | "BIKE" | "WALK" | "NONE"
    top_consumption_category: str  # "food" | "clothing" | "electronics" | "other" | "NONE"
    transport_kg: float
    electricity_kg: float
    consumption_kg: float


class ScenarioText(BaseModel):
    scenario_id: str
    title: str
    subtitle: str


class PersonalizeResponse(BaseModel):
    scenarios: List[ScenarioText]


# 교통수단별 맞춤 시나리오 텍스트 (scenarioId, title, subtitle)
TRANSPORT_TEXTS = {
    "CAR": [
        ("t1", "자동차 대신 지하철·버스 이용하기", "주된 이동수단인 자동차를 대중교통으로 바꿔보세요"),
        ("t3", "동승자와 함께 카풀하기", "자동차를 꼭 써야 한다면 카풀로 탄소를 나눠요"),
    ],
    "BUS": [
        ("t2", "단거리는 자전거로 이동하기", "버스 이용 구간 중 짧은 거리는 자전거가 더 효율적이에요"),
        ("t1", "지하철 환승으로 배출량 줄이기", "버스 대신 지하철을 활용해 탄소 배출을 낮춰보세요"),
    ],
    "SUBWAY": [
        ("t2", "역에서 목적지까지 자전거 타기", "지하철역에서 목적지까지 자전거를 활용해보세요"),
        ("t4", "1~2 정거장 거리는 걸어서 이동", "짧은 구간은 걸어서 이동해 건강과 탄소를 동시에 챙겨요"),
    ],
    "BIKE": [
        ("t4", "자전거로 가기엔 가까운 곳은 걷기", "10분 이내 거리는 도보로 이동해보세요"),
        ("t1", "장거리 이동 시 대중교통 활용", "먼 거리는 대중교통을 이용해 탄소를 더 줄여요"),
    ],
    "WALK": [
        ("t2", "자전거로 이동 범위 넓히기", "도보보다 먼 거리는 자전거를 활용해보세요"),
        ("t1", "장거리 이동 시 대중교통 선택", "걷기엔 먼 거리는 대중교통으로 효율적으로 이동해요"),
    ],
    "NONE": [
        ("t1", "대중교통 이용 습관 만들기", "개인 차량 대신 대중교통으로 탄소를 줄여보세요"),
        ("t2", "가까운 거리는 자전거·도보로", "짧은 이동은 친환경 수단을 먼저 고려해보세요"),
    ],
}

# 소비 카테고리별 맞춤 시나리오 텍스트
CONSUMPTION_TEXTS = {
    "food": [
        ("c1", "배달보다 직접 요리하기", "자주 시키는 배달 음식을 직접 요리로 대체해보세요"),
        ("c3", "일주일에 한 번 채식 식단 도전", "고기 대신 채소 위주 식단으로 탄소를 줄여보세요"),
    ],
    "clothing": [
        ("c4", "새 옷 대신 중고 거래 활용하기", "자주 구매하는 의류를 중고 거래로 대체해보세요"),
        ("c2", "필요한 것만 구매하는 습관", "충동 구매를 줄이고 오래 쓸 제품만 선택해보세요"),
    ],
    "electronics": [
        ("c4", "전자기기 중고 거래·수리 먼저", "새 제품 구매 전 중고나 수리를 먼저 고려해보세요"),
        ("c2", "전자기기 사용 수명 늘리기", "잦은 교체 대신 현재 기기를 더 오래 사용해보세요"),
    ],
    "other": [
        ("c2", "친환경 소비 습관 만들기", "로컬 제품과 포장재 줄이기를 실천해보세요"),
        ("c4", "중고 거래로 소비 탄소 줄이기", "새 제품 대신 중고 구매를 먼저 고려해보세요"),
    ],
    "NONE": [
        ("c1", "배달 횟수 줄여보기", "주 2회 이상의 배달을 직접 요리로 바꿔보세요"),
        ("c2", "친환경 소비 습관 만들기", "로컬 제품과 포장재 줄이기를 실천해보세요"),
    ],
}

# 전기 맞춤 시나리오 텍스트
ELECTRICITY_TEXTS = [
    ("e3", "냉난방 온도를 1도만 조절하기", "에어컨·난방 온도를 1도 조정해 전력 소비를 줄여보세요"),
    ("e1", "쓰지 않는 플러그 뽑아두기", "사용하지 않는 가전제품의 플러그를 뽑아 대기전력을 차단해보세요"),
]

COMMON_TEXTS = [
    ("m1", "텀블러·장바구니로 일회용품 줄이기", "매일 쓰는 일회용품을 다회용품으로 바꿔보세요"),
    ("m2", "올바른 분리수거 실천하기", "재활용 가능한 자원을 정확히 분류해 탄소를 줄여요"),
]


@app.post("/personalize", response_model=PersonalizeResponse)
def personalize(profile: UserProfile):
    """
    사용자 활동 프로필을 분석해 개인 맞춤 시나리오 텍스트를 생성한다.
    impactKg / impactWon / difficulty 는 BE의 DB에서 가져오며,
    이 엔드포인트는 title + subtitle 만 생성한다.
    """
    result: List[ScenarioText] = []

    # 1순위 카테고리 결정
    scores = {
        "TRANSPORT": profile.transport_kg,
        "ELECTRICITY": profile.electricity_kg,
        "CONSUMPTION": profile.consumption_kg,
    }
    priorities = sorted(scores, key=lambda k: scores[k], reverse=True)
    top = priorities[0]
    second = priorities[1]

    # 1순위 카테고리 시나리오 2개
    if top == "TRANSPORT":
        texts = TRANSPORT_TEXTS.get(profile.top_transport_mode, TRANSPORT_TEXTS["NONE"])
    elif top == "ELECTRICITY":
        texts = ELECTRICITY_TEXTS
    else:
        texts = CONSUMPTION_TEXTS.get(profile.top_consumption_category, CONSUMPTION_TEXTS["NONE"])

    for sid, title, subtitle in texts[:2]:
        result.append(ScenarioText(scenario_id=sid, title=title, subtitle=subtitle))

    # 2순위 카테고리 시나리오 1개
    if second == "TRANSPORT":
        second_texts = TRANSPORT_TEXTS.get(profile.top_transport_mode, TRANSPORT_TEXTS["NONE"])
    elif second == "ELECTRICITY":
        second_texts = ELECTRICITY_TEXTS
    else:
        second_texts = CONSUMPTION_TEXTS.get(profile.top_consumption_category, CONSUMPTION_TEXTS["NONE"])

    if second_texts:
        sid, title, subtitle = second_texts[0]
        result.append(ScenarioText(scenario_id=sid, title=title, subtitle=subtitle))

    # 공통 시나리오 1개
    sid, title, subtitle = COMMON_TEXTS[0]
    result.append(ScenarioText(scenario_id=sid, title=title, subtitle=subtitle))

    return PersonalizeResponse(scenarios=result)


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    # 데이터가 3개 미만이면 최근달 기준 10% 감소 목표 반환
    if len(request.data) < 3:
        latest = request.data[-1].emission_kg if request.data else 100.0
        return PredictResponse(predicted_kg=round(latest * 0.9, 2))

    df = pd.DataFrame([
        {"date": p.date, "emission_kg": p.emission_kg}
        for p in request.data
    ])

    try:
        predicted = forecast_next_month(df)
        return PredictResponse(predicted_kg=round(max(predicted, 0.0), 2))
    except Exception:
        # ARIMA 실패 시 최근달 10% 감소 목표로 fallback
        latest = request.data[-1].emission_kg
        return PredictResponse(predicted_kg=round(latest * 0.9, 2))
