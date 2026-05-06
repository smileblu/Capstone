from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from forecast import forecast_next_month
from anomaly import detect_anomaly_zscore
import os
import json
import httpx

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
    reduction_rate: float = 1.0


class PersonalizeResponse(BaseModel):
    scenarios: List[ScenarioText]


ALLOWED_SCENARIO_IDS = [
    "t1", "t2", "t3", "t4", "t5",
    "e1", "e2", "e3", "e4",
    "c1", "c2", "c3", "c4",
    "m1", "m2",
]


def _env(key: str, default: str = "") -> str:
    v = os.getenv(key, default)
    return v.strip() if isinstance(v, str) else default


def _llm_provider() -> str:
    """
    LLM_PROVIDER:
    - GEMINI: Google AI Studio Gemini API (API key)
    - CLAUDE: (향후 교체용) Claude API
    - DISABLED: LLM 사용 안 함
    """
    return (_env("LLM_PROVIDER", "GEMINI") or "GEMINI").upper()


def _llm_enabled() -> bool:
    p = _llm_provider()
    if p == "GEMINI":
        return bool(_env("GEMINI_API_KEY"))
    if p == "CLAUDE":
        return bool(_env("CLAUDE_API_KEY"))
    return False


def _build_personalize_prompt(profile: UserProfile) -> str:
    return f"""
너는 탄소 감축 코칭 어시스턴트다. 아래 사용자 프로필을 보고, 시나리오 후보 중에서 4개를 골라 추천해라.

요구사항:
- 반드시 JSON만 출력한다. (코드블록/설명 금지)
- scenarios는 정확히 4개
- scenario_id는 허용 목록 중 하나
- reduction_rate는 0.05~0.50 사이 실수(감축률)
- title/subtitle은 한국어로 짧고 실행 가능하게

허용 scenario_id 목록:
{ALLOWED_SCENARIO_IDS}

사용자 프로필:
- top_transport_mode: {profile.top_transport_mode}
- top_consumption_category: {profile.top_consumption_category}
- transport_kg: {profile.transport_kg}
- electricity_kg: {profile.electricity_kg}
- consumption_kg: {profile.consumption_kg}

출력 JSON 스키마:
{{
  "scenarios": [
    {{ "scenario_id": "t1", "title": "...", "subtitle": "...", "reduction_rate": 0.12 }},
    {{ "scenario_id": "e3", "title": "...", "subtitle": "...", "reduction_rate": 0.08 }},
    {{ "scenario_id": "c1", "title": "...", "subtitle": "...", "reduction_rate": 0.10 }},
    {{ "scenario_id": "m1", "title": "...", "subtitle": "...", "reduction_rate": 0.06 }}
  ]
}}
""".strip()


def _parse_llm_json_to_response(content: str) -> Optional[PersonalizeResponse]:
    try:
        obj = json.loads(content)
        raw_list = obj.get("scenarios", [])
        if not isinstance(raw_list, list) or len(raw_list) != 4:
            return None

        out: List[ScenarioText] = []
        seen = set()
        for it in raw_list:
            sid = str(it.get("scenario_id", "")).strip()
            if sid not in ALLOWED_SCENARIO_IDS or sid in seen:
                return None
            seen.add(sid)
            title = str(it.get("title", "")).strip()
            subtitle = str(it.get("subtitle", "")).strip()
            if not title or not subtitle:
                return None
            rr = float(it.get("reduction_rate", 0.1))
            rr = max(0.05, min(rr, 0.50))
            out.append(ScenarioText(scenario_id=sid, title=title, subtitle=subtitle, reduction_rate=rr))
        return PersonalizeResponse(scenarios=out)
    except Exception:
        return None


def _call_gemini_text(prompt: str) -> Optional[str]:
    """
    Gemini API (AI Studio key) REST:
    POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    headers: x-goog-api-key
    """
    api_key = _env("GEMINI_API_KEY")
    if not api_key:
        return None

    model = _env("GEMINI_MODEL", "gemini-1.5-flash")
    base_url = _env("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com")
    timeout_s = float(_env("GEMINI_TIMEOUT_SEC", "20") or 20)

    url = f"{base_url}/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.2
        }
    }
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=timeout_s) as client:
            r = client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()

        text = (
            (data.get("candidates") or [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        return text if isinstance(text, str) and text.strip() else None
    except Exception:
        return None


def _call_llm_personalize(profile: UserProfile) -> Optional[PersonalizeResponse]:
    if not _llm_enabled():
        return None

    provider = _llm_provider()
    prompt = _build_personalize_prompt(profile)

    if provider == "GEMINI":
        content = _call_gemini_text(prompt)
        if not content:
            return None
        return _parse_llm_json_to_response(content)

    if provider == "CLAUDE":
        # TODO: 나중에 Claude API로 교체하기 쉽게 provider 분리해 둠
        # (현재는 미구현 → fallback 사용)
        return None

    return None


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


class AnomalyRequest(BaseModel):
    history: List[float]   # 과거 배출량 목록 (최소 window_size개 이상 권장)
    current: float         # 이번 달 배출량
    window_size: Optional[int] = 7


class AnomalyResponse(BaseModel):
    state: str             # normal / warning / outlier / stable / insufficient_data / ...
    window_size: int
    z_score: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    reason: str = ""


@app.post("/anomaly", response_model=AnomalyResponse)
def anomaly_detection(request: AnomalyRequest):
    result = detect_anomaly_zscore(
        history=request.history,
        current=request.current,
        window_size=request.window_size,
    )
    return AnomalyResponse(
        state=result.state,
        window_size=result.window_size,
        z_score=result.z_score,
        mean=result.mean,
        std=result.std,
        reason=result.reason,
    )


@app.post("/personalize", response_model=PersonalizeResponse)
def personalize(profile: UserProfile):
    """
    사용자 활동 프로필을 분석해 개인 맞춤 시나리오 텍스트를 생성한다.
    impactKg / impactWon / difficulty 는 BE의 DB에서 가져오며,
    이 엔드포인트는 title + subtitle 만 생성한다.
    """
    # 1) LLM 기반 추천 (키가 있으면 시도)
    llm = _call_llm_personalize(profile)
    if llm is not None:
        return llm

    # 2) fallback: 기존 rule-based 텍스트
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
        result.append(ScenarioText(scenario_id=sid, title=title, subtitle=subtitle, reduction_rate=0.12))

    # 2순위 카테고리 시나리오 1개
    if second == "TRANSPORT":
        second_texts = TRANSPORT_TEXTS.get(profile.top_transport_mode, TRANSPORT_TEXTS["NONE"])
    elif second == "ELECTRICITY":
        second_texts = ELECTRICITY_TEXTS
    else:
        second_texts = CONSUMPTION_TEXTS.get(profile.top_consumption_category, CONSUMPTION_TEXTS["NONE"])

    if second_texts:
        sid, title, subtitle = second_texts[0]
        result.append(ScenarioText(scenario_id=sid, title=title, subtitle=subtitle, reduction_rate=0.10))

    # 공통 시나리오 1개
    sid, title, subtitle = COMMON_TEXTS[0]
    result.append(ScenarioText(scenario_id=sid, title=title, subtitle=subtitle, reduction_rate=0.06))

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


class WeeklyPoint(BaseModel):
    week: str
    emission_kg: float


class PredictWeeklyRequest(BaseModel):
    data: List[WeeklyPoint]
    horizon: int = 2


class PredictWeeklyResponse(BaseModel):
    forecast_kg: List[float]


@app.post("/predict-weekly", response_model=PredictWeeklyResponse)
def predict_weekly(request: PredictWeeklyRequest):
    """
    분석 페이지의 '1주후/2주후' 예측값 산출용.
    - 입력: 최근 N주 배출량 (week label은 단순 표시용)
    - 출력: horizon(기본 2)주 ahead ARIMA 점예측 결과
    """
    horizon = int(request.horizon or 0)
    if horizon <= 0:
        horizon = 2

    history = [float(p.emission_kg) for p in (request.data or [])]
    if len(history) < 3:
        latest = history[-1] if history else 100.0
        # 데이터 부족 시: 최근 주 기준 10% 감축을 horizon만큼 반복 적용
        out = []
        v = latest
        for _ in range(horizon):
            v = max(v * 0.9, 0.0)
            out.append(round(v, 2))
        return PredictWeeklyResponse(forecast_kg=out)

    try:
        # forecast.py의 ARIMA 구현을 그대로 재사용
        from forecast import get_forecaster, ArimaForecastConfig

        forecaster = get_forecaster("arima", config=ArimaForecastConfig(order=(1, 1, 1)))
        result = forecaster.forecast(history=history, horizon=horizon)
        out = [round(max(x, 0.0), 2) for x in result.forecast]
        return PredictWeeklyResponse(forecast_kg=out)
    except Exception:
        latest = history[-1]
        out = []
        v = latest
        for _ in range(horizon):
            v = max(v * 0.9, 0.0)
            out.append(round(v, 2))
        return PredictWeeklyResponse(forecast_kg=out)
