from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from forecast import forecast_next_month
from anomaly import detect_anomaly_zscore
import os
import json
import re
import httpx
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ── ReportLab (PDF 생성용) ────────────────────────────────────────────────────
# NanumGothic 다운로드: https://hangeul.naver.com/font
# 또는: https://fonts.google.com/specimen/Nanum+Gothic
# 파일을 apps/AI/fonts/NanumGothic.ttf 에 넣어주세요.
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib.colors import HexColor, white, grey
    from reportlab.lib import colors as rl_colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("[경고] reportlab 미설치. pip install reportlab 실행 후 서버 재시작 필요.")

FONT_PATH   = os.path.join(os.path.dirname(__file__), 'fonts', 'NanumGothic.ttf')
REPORTS_DIR = os.path.join(os.path.dirname(__file__), 'generated_reports')

os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), 'fonts'), exist_ok=True)

FONT_AVAILABLE = False
if REPORTLAB_AVAILABLE:
    if os.path.exists(FONT_PATH):
        pdfmetrics.registerFont(TTFont('NanumGothic', FONT_PATH))
        FONT_AVAILABLE = True
        print(f"[PDF] 한글 폰트 로드: {FONT_PATH}", flush=True)
    else:
        print(f"[경고] 한글 폰트 없음. {FONT_PATH} 에 NanumGothic.ttf 를 넣어주세요.", flush=True)
        print("다운로드: https://hangeul.naver.com/font", flush=True)

FONT_NAME      = 'NanumGothic' if FONT_AVAILABLE else 'Helvetica'
FONT_BOLD_NAME = 'NanumGothic' if FONT_AVAILABLE else 'Helvetica-Bold'

app = FastAPI()


# ── 공통 모델 ─────────────────────────────────────────────────────────────────

class MonthlyPoint(BaseModel):
    date: str          # "YYYY-MM"
    emission_kg: float


class PredictRequest(BaseModel):
    data: List[MonthlyPoint]


class MonthlyBaselineResponse(BaseModel):
    forecast_kg: List[float]
    money_won: List[int]
    outlier_count: int
    outlier_months: List[str]


class UserProfile(BaseModel):
    top_transport_mode: str
    top_consumption_category: str
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


# ── 환경변수 헬퍼 ──────────────────────────────────────────────────────────────

def _env(key: str, default: str = "") -> str:
    v = os.getenv(key, default)
    return v.strip() if isinstance(v, str) else default


def _llm_provider() -> str:
    return (_env("LLM_PROVIDER", "CLAUDE") or "CLAUDE").upper()


def _llm_enabled() -> bool:
    p = _llm_provider()
    if p == "CLAUDE":
        return bool(_env("CLAUDE_API_KEY"))
    if p == "GEMINI":
        return bool(_env("GEMINI_API_KEY"))
    return False


# ── 개인 시나리오 프롬프트 ─────────────────────────────────────────────────────

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
    cleaned = re.sub(r"^```(?:json)?\s*", "", content.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"```\s*$", "", cleaned).strip()
    try:
        obj = json.loads(cleaned)
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


# ── Claude API 호출 (기존 - 개인 시나리오용) ──────────────────────────────────

def _call_claude_text(prompt: str) -> Optional[str]:
    api_key = _env("CLAUDE_API_KEY")
    if not api_key:
        return None

    model = _env("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
    base_url = _env("CLAUDE_BASE_URL", "https://api.anthropic.com").rstrip("/")
    timeout_s = float(_env("CLAUDE_TIMEOUT_SEC", "20") or 20)

    payload = {
        "model": model,
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    print(f"[AI] Claude API 요청 → {base_url}/v1/messages (model={model})", flush=True)

    try:
        with httpx.Client(timeout=timeout_s) as client:
            r = client.post(f"{base_url}/v1/messages", headers=headers, json=payload)
            print(f"[AI] Claude HTTP {r.status_code}", flush=True)
            if not r.is_success:
                print(f"[AI] Claude 오류 응답: {r.text[:400]}", flush=True)
                return None
            data = r.json()

        text = (data.get("content") or [{}])[0].get("text", "")
        if text and text.strip():
            print(f"[AI] Claude 성공: {text[:100]}", flush=True)
            return text
        print(f"[AI] Claude 텍스트 없음: {data}", flush=True)
        return None
    except Exception as e:
        print(f"[AI] Claude 예외: {type(e).__name__}: {e}", flush=True)
        return None


# ── Claude API 호출 (확장 - system prompt + model override 지원) ───────────────

def _call_claude_ex(prompt: str,
                    system_prompt: Optional[str] = None,
                    model: Optional[str] = None,
                    max_tokens: int = 2048) -> Optional[str]:
    api_key = _env("CLAUDE_API_KEY")
    if not api_key:
        return None

    _model = model or _env("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
    base_url = _env("CLAUDE_BASE_URL", "https://api.anthropic.com").rstrip("/")
    timeout_s = float(_env("CLAUDE_TIMEOUT_SEC", "30") or 30)

    payload: dict = {
        "model": _model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system_prompt:
        payload["system"] = system_prompt

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=timeout_s) as client:
            r = client.post(f"{base_url}/v1/messages", headers=headers, json=payload)
            if not r.is_success:
                print(f"[AI] Claude 오류 ({r.status_code}): {r.text[:200]}", flush=True)
                return None
            data = r.json()
        text = (data.get("content") or [{}])[0].get("text", "")
        return text.strip() if text.strip() else None
    except Exception as e:
        print(f"[AI] Claude 예외: {type(e).__name__}: {e}", flush=True)
        return None


def _call_gemini_text(prompt: str) -> Optional[str]:
    api_key = _env("GEMINI_API_KEY")
    if not api_key:
        return None

    model = _env("GEMINI_MODEL", "gemini-2.0-flash")
    base_url = _env("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com")
    timeout_s = float(_env("GEMINI_TIMEOUT_SEC", "20") or 20)

    url = f"{base_url}/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2},
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


# ── 이상치 탐지·보간 (Z-score, 개인 예측용) ──────────────────────────────────

def _detect_and_interpolate_monthly(
    series: List[float],
    months: List[str],
    window_size: int = 4,
) -> tuple:
    n = len(series)
    if n < 2:
        return list(series), 0, []

    outlier_set: set = set()
    outlier_months_out: List[str] = []

    for i in range(1, n):
        win = series[max(0, i - window_size):i]
        if len(win) < 2:
            continue
        result = detect_anomaly_zscore(
            history=win,
            current=series[i],
            window_size=len(win),
        )
        if result.state == "outlier":
            outlier_set.add(i)
            outlier_months_out.append(months[i] if i < len(months) else str(i))

    if not outlier_set:
        return list(series), 0, []

    cleaned = list(series)
    for idx in sorted(outlier_set):
        left_idx = idx - 1
        while left_idx >= 0 and left_idx in outlier_set:
            left_idx -= 1
        right_idx = idx + 1
        while right_idx < n and right_idx in outlier_set:
            right_idx += 1

        if left_idx >= 0 and right_idx < n:
            lv, rv = cleaned[left_idx], series[right_idx]
            cleaned[idx] = lv + (rv - lv) * (idx - left_idx) / (right_idx - left_idx)
        elif left_idx >= 0:
            cleaned[idx] = cleaned[left_idx]
        else:
            cleaned[idx] = series[right_idx] if right_idx < n else series[0]

    return cleaned, len(outlier_set), outlier_months_out


def _arima_auto_3m_forecast(series: List[float], steps: int = 3) -> List[float]:
    arr = [float(v) for v in series]

    try:
        from pmdarima import auto_arima
        model = auto_arima(
            arr,
            seasonal=False,
            information_criterion="aic",
            suppress_warnings=True,
            error_action="ignore",
            stepwise=True,
        )
        forecast = model.predict(n_periods=steps)
        return [max(0.0, float(f)) for f in forecast]
    except Exception:
        pass

    try:
        import numpy as np
        from statsmodels.tsa.arima.model import ARIMA
        fit = ARIMA(np.array(arr, dtype=float), order=(1, 1, 1)).fit()
        pred = fit.forecast(steps=steps)
        return [max(0.0, float(f)) for f in np.asarray(pred).reshape(-1)]
    except Exception:
        v = arr[-1] if arr else 0.0
        out = []
        for _ in range(steps):
            v = max(v * 0.9, 0.0)
            out.append(round(v, 2))
        return out


def _apply_drift_correction(forecast: List[float], series: List[float]) -> List[float]:
    n = len(series)
    if n < 4 or series[n - 4] == 0:
        return forecast
    change_rate = (series[n - 1] - series[n - 4]) / abs(series[n - 4])
    if abs(change_rate) < 0.15:
        return forecast
    return [max(0.0, f * (1.0 + change_rate * 0.5)) for f in forecast]


def _call_llm_personalize(profile: UserProfile) -> Optional[PersonalizeResponse]:
    print(f"[AI] _call_llm_personalize 진입 | provider={_llm_provider()} | enabled={_llm_enabled()}", flush=True)
    if not _llm_enabled():
        print("[AI] LLM disabled → None 반환", flush=True)
        return None

    provider = _llm_provider()
    prompt = _build_personalize_prompt(profile)

    if provider == "CLAUDE":
        print("[AI] Claude 호출 시작", flush=True)
        content = _call_claude_text(prompt)
        print(f"[AI] Claude 응답: {repr(content[:100]) if content else None}", flush=True)
        if not content:
            return None
        return _parse_llm_json_to_response(content)

    if provider == "GEMINI":
        content = _call_gemini_text(prompt)
        if not content:
            return None
        return _parse_llm_json_to_response(content)

    return None


# ── 이상치 감지 API ───────────────────────────────────────────────────────────

class AnomalyRequest(BaseModel):
    history: List[float]
    current: float
    window_size: Optional[int] = 7


class AnomalyResponse(BaseModel):
    state: str
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


# ── 개인 시나리오 개인화 ───────────────────────────────────────────────────────

@app.post("/personalize", response_model=PersonalizeResponse)
def personalize(profile: UserProfile):
    llm = _call_llm_personalize(profile)
    if llm is not None:
        return llm
    raise HTTPException(status_code=503, detail="LLM unavailable")


# ── 월별 예측 ─────────────────────────────────────────────────────────────────

@app.post("/predict", response_model=MonthlyBaselineResponse)
def predict(request: PredictRequest):
    SCC_WON_PER_KG = 285

    if len(request.data) < 3:
        latest = request.data[-1].emission_kg if request.data else 100.0
        out: List[float] = []
        v = latest
        for _ in range(3):
            v = max(v * 0.9, 0.0)
            out.append(round(v, 2))
        return MonthlyBaselineResponse(
            forecast_kg=out,
            money_won=[int(round(f * SCC_WON_PER_KG)) for f in out],
            outlier_count=0,
            outlier_months=[],
        )

    months = [p.date for p in request.data]
    raw_series = [float(p.emission_kg) for p in request.data]

    cleaned, outlier_count, outlier_months = _detect_and_interpolate_monthly(raw_series, months)
    forecast = _arima_auto_3m_forecast(cleaned)
    forecast = _apply_drift_correction(forecast, cleaned)
    forecast = [round(f, 2) for f in forecast]
    money_won = [int(round(f * SCC_WON_PER_KG)) for f in forecast]

    return MonthlyBaselineResponse(
        forecast_kg=forecast,
        money_won=money_won,
        outlier_count=outlier_count,
        outlier_months=outlier_months,
    )


# ── 주간 예측 ─────────────────────────────────────────────────────────────────

class WeeklyPoint(BaseModel):
    week: str
    emission_kg: float


class PredictWeeklyRequest(BaseModel):
    data: List[WeeklyPoint]
    horizon: int = 2


class PredictWeeklyResponse(BaseModel):
    forecast_kg: List[float]
    outlier_count: int = 0


@app.post("/predict-weekly", response_model=PredictWeeklyResponse)
def predict_weekly(request: PredictWeeklyRequest):
    horizon = int(request.horizon or 0)
    if horizon <= 0:
        horizon = 2

    history = [float(p.emission_kg) for p in (request.data or [])]
    weeks   = [p.week             for p in (request.data or [])]

    if len(history) < 3:
        latest = history[-1] if history else 100.0
        out, v = [], latest
        for _ in range(horizon):
            v = max(v * 0.9, 0.0)
            out.append(round(v, 2))
        return PredictWeeklyResponse(forecast_kg=out, outlier_count=0)

    win = min(3, len(history) - 1)
    cleaned, outlier_count, _ = _detect_and_interpolate_monthly(history, weeks, window_size=win)
    forecast = _arima_auto_3m_forecast(cleaned, steps=horizon)
    forecast = _apply_drift_correction(forecast, cleaned)
    forecast = [round(max(f, 0.0), 2) for f in forecast]

    return PredictWeeklyResponse(forecast_kg=forecast, outlier_count=outlier_count)


# ═══════════════════════════════════════════════════════════════════════════════
# 작업 3-A: 기업 배출 Baseline ARIMA/SARIMA 예측
# ═══════════════════════════════════════════════════════════════════════════════

def _iqr_detect_replace(series: List[float]) -> tuple:
    """IQR 방식 이상치 탐지 후 이웃 평균으로 대체. (index 목록, 정제 시리즈) 반환."""
    import numpy as np
    arr = np.array(series, dtype=float)
    if len(arr) < 4:
        return list(arr), []
    q1, q3 = float(np.percentile(arr, 25)), float(np.percentile(arr, 75))
    iqr = q3 - q1
    lower_b = q1 - 1.5 * iqr
    upper_b = q3 + 1.5 * iqr
    outlier_idx: List[int] = [i for i, v in enumerate(arr) if v < lower_b or v > upper_b]
    cleaned = arr.copy()
    for i in outlier_idx:
        neighbors = [float(arr[j]) for j in [i - 1, i + 1]
                     if 0 <= j < len(arr) and j not in outlier_idx]
        cleaned[i] = float(np.mean(neighbors)) if neighbors else float(np.mean(arr))
    return cleaned.tolist(), outlier_idx


def _check_seasonal_ratio(series: List[float]) -> Optional[float]:
    """STL 분해로 계절성 분산 비율 계산. 실패 시 None."""
    import numpy as np
    try:
        from statsmodels.tsa.seasonal import STL
        arr = np.array(series, dtype=float)
        stl = STL(arr, period=12, robust=True).fit()
        sv = float(np.var(stl.seasonal))
        tv = float(np.var(arr))
        return sv / tv if tv > 0 else 0.0
    except Exception:
        return None


def _arima_forecast_with_ci(series: List[float], steps: int = 6,
                             seasonal: bool = False) -> tuple:
    """
    ARIMA/SARIMA 예측 + 95% 신뢰구간.
    Returns: (forecast, upper, lower) — List[float] 각각.
    """
    import numpy as np
    arr = [float(v) for v in series]
    try:
        from pmdarima import auto_arima
        if seasonal:
            model = auto_arima(
                arr, seasonal=True, m=12,
                max_p=2, max_q=2, max_P=1, max_Q=1,
                stepwise=True, suppress_warnings=True, error_action="ignore",
            )
        else:
            model = auto_arima(
                arr, seasonal=False,
                max_p=3, max_q=3,
                stepwise=True, suppress_warnings=True, error_action="ignore",
            )
        forecast_arr, conf_int = model.predict(n_periods=steps, return_conf_int=True)
        fc    = [max(0.0, float(f)) for f in forecast_arr]
        upper = [max(0.0, float(u)) for u in conf_int[:, 1]]
        lower = [max(0.0, float(l)) for l in conf_int[:, 0]]
        return fc, upper, lower
    except Exception:
        pass
    # fallback: 선형 외삽
    v = arr[-1] if arr else 0.0
    slope = (arr[-1] - arr[0]) / max(len(arr) - 1, 1) if len(arr) > 1 else 0.0
    fc = [max(0.0, round(v + slope * (i + 1), 2)) for i in range(steps)]
    margin = max(v * 0.1, 1.0)
    return fc, [round(f + margin, 2) for f in fc], [max(0.0, round(f - margin, 2)) for f in fc]


class CompanyBaselineRequest(BaseModel):
    monthly_emissions: List[float]   # tCO₂e, 오래된 것부터
    data_months: int
    industry_type: Optional[str] = None


class CompanyBaselineResponse(BaseModel):
    status: str                       # "ok" | "insufficient"
    model_used: str                   # "ARIMA" | "SARIMA" | "linear_fallback"
    data_months: int
    forecast: List[float]             # 향후 6개월 예측 (tCO₂e)
    forecast_upper: List[float]
    forecast_lower: List[float]
    outlier_months: List[int]
    seasonal_ratio: Optional[float] = None
    drift_applied: bool


@app.post("/company-baseline", response_model=CompanyBaselineResponse)
def company_baseline(request: CompanyBaselineRequest):
    """
    월별 배출량 시계열 → ARIMA/SARIMA 6개월 예측 + 95% 신뢰구간.
    6개월 미만 데이터 시 선형 외삽 fallback.
    """
    data = [float(v) for v in request.monthly_emissions]
    n = len(data)

    # STEP 1: 데이터 충분성
    if n < 6:
        v = data[-1] if data else 0.0
        slope = (data[-1] - data[0]) / max(n - 1, 1) if n > 1 else 0.0
        fc = [max(0.0, round(v + slope * (i + 1), 2)) for i in range(6)]
        margin = max(v * 0.1, 1.0)
        print(f"[AI] /company-baseline 데이터 부족 ({n}개월) → 선형 외삽", flush=True)
        return CompanyBaselineResponse(
            status="insufficient", model_used="linear_fallback",
            data_months=n, forecast=fc,
            forecast_upper=[round(f + margin, 2) for f in fc],
            forecast_lower=[max(0.0, round(f - margin, 2)) for f in fc],
            outlier_months=[], seasonal_ratio=None, drift_applied=False,
        )

    # STEP 2: IQR 이상치 탐지·대체
    cleaned, outlier_months = _iqr_detect_replace(data)

    # STEP 3: 계절성 판단 (12개월 이상)
    seasonal_ratio: Optional[float] = None
    use_sarima = False
    if n >= 12:
        seasonal_ratio = _check_seasonal_ratio(cleaned)
        if seasonal_ratio is not None and seasonal_ratio >= 0.3:
            use_sarima = True

    model_used = "SARIMA" if use_sarima else "ARIMA"
    print(f"[AI] /company-baseline 모델={model_used} 데이터={n}개월 이상치={outlier_months}", flush=True)

    # STEP 4: 예측
    forecast, forecast_upper, forecast_lower = _arima_forecast_with_ci(
        cleaned, steps=6, seasonal=use_sarima
    )

    # STEP 5: 드리프트 보정
    drift_applied = False
    if n >= 4 and cleaned[n - 4] != 0:
        change_rate = (cleaned[n - 1] - cleaned[n - 4]) / abs(cleaned[n - 4])
        if abs(change_rate) > 0.15:
            m = 1.0 + change_rate * 0.5
            forecast       = [max(0.0, round(f * m, 2)) for f in forecast]
            forecast_upper = [max(0.0, round(f * m, 2)) for f in forecast_upper]
            forecast_lower = [max(0.0, round(f * m, 2)) for f in forecast_lower]
            drift_applied = True

    print(f"[AI] /company-baseline 완료 forecast={forecast}", flush=True)
    return CompanyBaselineResponse(
        status="ok", model_used=model_used, data_months=n,
        forecast=[round(f, 2) for f in forecast],
        forecast_upper=[round(f, 2) for f in forecast_upper],
        forecast_lower=[round(f, 2) for f in forecast_lower],
        outlier_months=outlier_months,
        seasonal_ratio=round(seasonal_ratio, 4) if seasonal_ratio is not None else None,
        drift_applied=drift_applied,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 작업 4-A: 기업 맞춤 감축 시나리오 LLM 생성
# ═══════════════════════════════════════════════════════════════════════════════

COMPANY_SCENARIO_SYSTEM = """당신은 중소기업 탄소 감축 전문 컨설턴트입니다.
주어진 기업 데이터를 바탕으로 실행 가능한 감축 전략 3개를 제안하세요.

규칙:
1. 반드시 JSON만 출력하며, 다른 텍스트는 포함하지 않습니다.
2. reduction_rate는 해당 카테고리 내 감축률로 0.0에서 1.0 사이의 값을 가집니다.
3. 전략은 실행 가능성(feasibility)이 높은 것을 우선합니다.
4. 업종이 제조업 또는 공장이면 설비·공정 중심 전략을 제안합니다.
   일반 사무형이면 에너지 절약·행동 변화 중심 전략을 제안합니다.
5. onboarding_purpose에 따라 전략 방향을 달리합니다:
   - internal(내부관리): 투자 대비 월별 절감액 최대화 전략 우선
   - customer_submit(고객사 제출): Scope 커버리지 완성도, 데이터 신뢰도 확보 전략 우선
   - esg_compliance(ESG 규제대응): K-ETS 초과 리스크 최소화, 과징금 회피 전략 우선
6. feasibility가 가장 높은 시나리오 하나에만 recommended: true를 표시합니다.
7. name은 10자 이내 짧은 제목, description은 한 문장 30자 이내로 작성합니다.
8. 출력 JSON 형식:
{
  "scenarios": [
    {
      "id": "A",
      "name": "에너지 효율화",
      "label": "Moderate Reduction",
      "description": "LED·고효율 설비 교체로 전력 소비를 절감합니다.",
      "difficulty": "low",
      "recommended": true,
      "feasibility": 0.85,
      "actions": [
        {
          "target_category": "electricity",
          "action_desc": "구체적 실행 내용",
          "reduction_rate": 0.12,
          "investment_cost_krw": 5000000,
          "payback_months": 18
        }
      ]
    }
  ]
}
시나리오는 A(Moderate), B(Strong), C(Maximum) 순으로 난이도를 구분하며 정확히 3개입니다."""


class _CompanyContext(BaseModel):
    industry: str
    site_type: str
    employee_count: int
    onboarding_purpose: str


class _EmissionSummary(BaseModel):
    recent_3mo_avg_total: float
    yoy_change_pct: float
    category_weights: dict


class _CostContext(BaseModel):
    monthly_carbon_cost_krw: int
    k_ets_price: int


class CompanyScenarioRequest(BaseModel):
    company_context: _CompanyContext
    emission_summary: _EmissionSummary
    baseline_forecast: List[float]
    cost_context: _CostContext
    fuel_types: Optional[List[str]] = []


def _build_company_scenario_prompt(req: CompanyScenarioRequest) -> str:
    ctx = req.company_context
    ems = req.emission_summary
    cost = req.cost_context
    purpose_map = {
        "internal": "내부 비용 절감 중심",
        "customer_submit": "고객사 제출 대응",
        "esg_compliance": "ESG 규제 대응",
    }
    purpose_label = purpose_map.get(ctx.onboarding_purpose, ctx.onboarding_purpose)
    cw = ems.category_weights
    yoy_dir = "증가" if ems.yoy_change_pct > 0 else "감소"
    fuel_str = ", ".join(req.fuel_types) if req.fuel_types else "없음"

    return (
        f"기업 정보:\n"
        f"- 업종: {ctx.industry} / {ctx.site_type} / 직원 {ctx.employee_count}명\n"
        f"- 온보딩 목적: {purpose_label} ({ctx.onboarding_purpose})\n\n"
        f"배출 현황:\n"
        f"- 최근 3개월 평균: {ems.recent_3mo_avg_total:.1f} kgCO₂e/월\n"
        f"- 전년 대비: {ems.yoy_change_pct:+.1f}% {yoy_dir} 중\n"
        f"- 주요 배출원: "
        f"전기({cw.get('electricity', 0)*100:.0f}%), "
        f"고정연소({cw.get('stationary_fuel', 0)*100:.0f}%), "
        f"이동연소({cw.get('mobile_combustion', 0)*100:.0f}%), "
        f"폐기물({cw.get('waste', 0)*100:.0f}%), "
        f"용수({cw.get('water', 0)*100:.0f}%)\n"
        f"- 사용 연료: {fuel_str}\n\n"
        f"비용 현황:\n"
        f"- 현재 탄소 비용(K-ETS 기준): 약 {cost.monthly_carbon_cost_krw:,}원/월\n"
        f"- 향후 6개월 현상유지 예측: {req.baseline_forecast}\n\n"
        f"위 상황에서 비용 대비 효과가 높은 감축 전략 3가지를 JSON으로만 출력하세요."
    )


def _validate_company_scenarios(obj: dict) -> bool:
    scenarios = obj.get("scenarios") or []
    if len(scenarios) != 3:
        return False
    for s in scenarios:
        if not all(k in s for k in ("id", "name", "actions")):
            return False
        for a in s.get("actions", []):
            try:
                rr = float(a.get("reduction_rate", -1))
                if not 0.0 <= rr <= 1.0:
                    return False
            except (TypeError, ValueError):
                return False
    return True


@app.post("/company-scenario")
def company_scenario_endpoint(request: CompanyScenarioRequest):
    """
    기업 맞춤 탄소 감축 시나리오 3개를 Claude API로 생성.
    3회 실패 시 {"error": "scenario_generation_failed"} 반환.
    """
    api_key = _env("CLAUDE_API_KEY")
    if not api_key:
        print("[AI] /company-scenario CLAUDE_API_KEY 미설정", flush=True)
        return {"error": "scenario_generation_failed"}

    model = _env("CLAUDE_SCENARIO_MODEL") or _env("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
    prompt = _build_company_scenario_prompt(request)

    for attempt in range(3):
        print(f"[AI] /company-scenario Claude 호출 (attempt {attempt + 1}, model={model})", flush=True)
        content = _call_claude_ex(
            prompt, system_prompt=COMPANY_SCENARIO_SYSTEM,
            model=model, max_tokens=2048,
        )
        if not content:
            continue
        cleaned = re.sub(r"^```(?:json)?\s*", "", content.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r"```\s*$", "", cleaned).strip()
        try:
            obj = json.loads(cleaned)
            if _validate_company_scenarios(obj):
                print(f"[AI] /company-scenario 성공 (attempt {attempt + 1})", flush=True)
                return obj
            print(f"[AI] /company-scenario 검증 실패 (attempt {attempt + 1})", flush=True)
        except Exception as e:
            print(f"[AI] /company-scenario JSON 파싱 실패 (attempt {attempt + 1}): {e}", flush=True)

    return {"error": "scenario_generation_failed"}


# ═══════════════════════════════════════════════════════════════════════════════
# ESG 보고서 생성 (/company-report)
# ═══════════════════════════════════════════════════════════════════════════════

REPORT_SYSTEM_PROMPT = """당신은 GRI(Global Reporting Initiative)와 K-ESG 가이드라인을 숙지한
탄소배출 ESG 보고서 작성 전문가입니다.
주어진 기업 데이터를 바탕으로 전문적인 ESG 보고서 섹션을 한국어로 작성하세요.

규칙:
1. 전문적이고 공식적인 문체를 사용합니다.
2. 구체적인 수치를 반드시 포함합니다.
3. GRI 300번대(환경) 지표 관점에서 서술합니다.
4. 각 섹션은 3~5문장으로 작성합니다.
5. 반드시 JSON만 출력합니다. 다른 텍스트 없음."""


class _ReportCompanyContext(BaseModel):
    industry: str
    site_type: str
    onboarding_purpose: str


class _ReportEmissionData(BaseModel):
    scope1_total_kg: float
    scope2_total_kg: float
    scope3_total_kg: float
    grand_total_kg: float
    cost_total_krw: int
    k_ets_price_per_ton: int
    mom_change_pct: float
    top_emission_source: str
    top_emission_pct: float
    baseline_trend: str
    category_breakdown: Optional[dict] = {}


class _ReportScenario(BaseModel):
    id: str
    name: str
    difficulty: str
    recommended: bool
    co2_reduction_kg: float
    cost_saving_krw: int
    investment_cost_krw: int
    payback_months: float
    five_year_roi_pct: Optional[float] = None


class CompanyReportRequest(BaseModel):
    company_id: int
    company_name: str
    company_context: _ReportCompanyContext
    report_period: str
    emission_data: _ReportEmissionData
    baseline_forecast: Optional[List[float]] = []
    scenarios: List[_ReportScenario]


def _build_report_prompt(req: CompanyReportRequest) -> str:
    ed  = req.emission_data
    ctx = req.company_context
    purpose_map = {
        "internal":        "내부 비용 절감 중심",
        "customer_submit": "고객사 제출 대응",
        "esg_compliance":  "ESG 규제 대응",
    }
    trend_map = {
        "increase": "증가 추세", "slight_increase": "소폭 증가 추세",
        "decrease": "감소 추세", "slight_decrease": "소폭 감소 추세",
        "stable":   "안정적",
    }
    sc_map = {s.id: s for s in req.scenarios}
    sa, sb, sc = sc_map.get('A'), sc_map.get('B'), sc_map.get('C')

    def sc_line(s: Optional[_ReportScenario], label: str) -> str:
        if not s:
            return f"- {label}: 정보 없음"
        return (f"- {label} ({s.name}): 절감 {s.co2_reduction_kg:.1f}kg, "
                f"절감비용 {s.cost_saving_krw:,}원, 투자 {s.investment_cost_krw:,}원")

    return (
        f"기업 정보:\n"
        f"- 업종: {ctx.industry} / {ctx.site_type}\n"
        f"- 보고 기간: {req.report_period}\n"
        f"- 온보딩 목적: {purpose_map.get(ctx.onboarding_purpose, ctx.onboarding_purpose)}\n\n"
        f"배출량 현황 (보고 기간 합산):\n"
        f"- Scope 1 (직접배출): {ed.scope1_total_kg:.1f} kgCO₂e\n"
        f"- Scope 2 (전기 간접배출): {ed.scope2_total_kg:.1f} kgCO₂e\n"
        f"- Scope 3 (기타 간접배출): {ed.scope3_total_kg:.1f} kgCO₂e\n"
        f"- 총 배출량: {ed.grand_total_kg:.1f} kgCO₂e\n"
        f"- K-ETS 기준 탄소 비용: {ed.cost_total_krw:,}원\n"
        f"- 전월 대비 증감: {ed.mom_change_pct:+.1f}%\n"
        f"- 주요 배출원: {ed.top_emission_source} ({ed.top_emission_pct:.0f}%)\n"
        f"- 현상유지 예측 추세: {trend_map.get(ed.baseline_trend, ed.baseline_trend)}\n\n"
        f"감축 시나리오 요약:\n"
        f"{sc_line(sa, 'A')}\n"
        f"{sc_line(sb, 'B')}\n"
        f"{sc_line(sc, 'C')}\n\n"
        f"아래 JSON으로 출력:\n"
        f"{{\n"
        f'  "emission_analysis": "배출량 현황 분석 (수치 포함, 3~5문장)",\n'
        f'  "scope_breakdown": "Scope별 배출 원인 분석 (3~5문장)",\n'
        f'  "risk_assessment": "K-ETS 리스크 및 규제 대응 평가 (3~5문장)",\n'
        f'  "scenario_recommendation": "감축 시나리오 비교 및 권고 (3~5문장)",\n'
        f'  "conclusion": "종합 결론 및 향후 방향 (3~5문장)"\n'
        f"}}"
    )


def _build_esg_pdf(req: CompanyReportRequest, llm_text: dict, ts: str) -> str:
    """ReportLab으로 ESG 보고서 PDF 생성. 파일 절대경로 반환."""
    filename = f"ESG_{req.company_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    ed    = req.emission_data
    ctx   = req.company_context
    k_ets = ed.k_ets_price_per_ton
    grand = ed.grand_total_kg or 1.0

    GREEN       = HexColor('#2D6A4F')
    LIGHT_GREEN = HexColor('#E8F5E9')
    fn, fb      = FONT_NAME, FONT_BOLD_NAME

    def ps(name, size=9, bold=False, color=None, sb=0, sa=6):
        return ParagraphStyle(
            name, fontName=fb if bold else fn,
            fontSize=size, textColor=color or HexColor('#1a1a1a'),
            spaceBefore=sb, spaceAfter=sa, leading=size * 1.45,
        )

    s_cover_brand = ps('CB',  24, bold=True, color=GREEN, sa=4)
    s_cover_title = ps('CT',  20, bold=True, sa=6)
    s_cover_co    = ps('CC',  16, sa=6)
    s_cover_body  = ps('CB2', 12, sa=4)
    s_cover_small = ps('CS',  10, color=HexColor('#666666'), sa=4)
    s_cover_note  = ps('CN',   8, color=HexColor('#666666'))
    s_section     = ps('SC',  13, bold=True, color=GREEN, sb=10, sa=8)
    s_body        = ps('BD',   9, sa=6)

    def tbl_style(has_bold_last=False):
        base = [
            ('BACKGROUND',   (0,0),  (-1,0),  GREEN),
            ('TEXTCOLOR',    (0,0),  (-1,0),  white),
            ('FONTNAME',     (0,0),  (-1,0),  fb),
            ('FONTSIZE',     (0,0),  (-1,0),  9),
            ('FONTNAME',     (0,1),  (-1,-1), fn),
            ('FONTSIZE',     (0,1),  (-1,-1), 9),
            ('GRID',         (0,0),  (-1,-1), 0.5, HexColor('#CCCCCC')),
            ('ALIGN',        (0,0),  (-1,-1), 'CENTER'),
            ('ALIGN',        (0,0),  (0,-1),  'LEFT'),
            ('LEFTPADDING',  (0,0),  (-1,-1), 6),
            ('RIGHTPADDING', (0,0),  (-1,-1), 6),
            ('TOPPADDING',   (0,0),  (-1,-1), 4),
            ('BOTTOMPADDING',(0,0),  (-1,-1), 4),
            ('ROWBACKGROUNDS',(0,1), (-1, -2 if has_bold_last else -1),
             [white, HexColor('#F5F5F5')]),
        ]
        if has_bold_last:
            base += [
                ('BACKGROUND', (0,-1), (-1,-1), LIGHT_GREEN),
                ('FONTNAME',   (0,-1), (-1,-1), fb),
            ]
        return TableStyle(base)

    def pct(v):   return f"{v/grand*100:.1f}%"
    def krw_s(v): return f"{round(v/1000*k_ets):,}"

    story = []

    # ① 표지
    story += [
        Spacer(1, 3.5*cm),
        Paragraph("COCO", s_cover_brand),
        Spacer(1, 0.5*cm),
        Paragraph("ESG 탄소배출 보고서", s_cover_title),
        Spacer(1, 0.8*cm),
        Paragraph(req.company_name, s_cover_co),
        Spacer(1, 0.5*cm),
        Paragraph(f"보고 기간: {req.report_period}", s_cover_body),
        Spacer(1, 0.3*cm),
        Paragraph(f"생성일: {ts}", s_cover_small),
        Spacer(1, 2.5*cm),
        Paragraph("본 보고서는 GRI 300번대 환경 지표 기준으로 작성되었습니다.", s_cover_note),
        PageBreak(),
    ]

    # ② 1장. 기업 개요
    purpose_map = {"internal":"내부 비용 절감","customer_submit":"고객사 제출","esg_compliance":"ESG 규제 대응"}
    story.append(Paragraph("1장. 기업 개요", s_section))
    t1 = Table([
        ["항목", "내용"],
        ["업종", ctx.industry], ["사업장 유형", ctx.site_type],
        ["보고 기간", req.report_period], ["적용 기준", "GRI 300 / K-ESG"],
        ["K-ETS 단가", f"{k_ets:,}원/tCO₂e"],
        ["온보딩 목적", purpose_map.get(ctx.onboarding_purpose, ctx.onboarding_purpose)],
    ], colWidths=[5*cm, 11*cm])
    t1.setStyle(tbl_style())
    story += [t1, Spacer(1, 0.4*cm)]

    # ③ 2장. 탄소배출량 현황
    s1, s2, s3 = ed.scope1_total_kg, ed.scope2_total_kg, ed.scope3_total_kg
    story.append(Paragraph("2장. 탄소배출량 현황", s_section))
    t2 = Table([
        ["구분","배출량 (kgCO₂e)","비중","K-ETS 환산 (원)"],
        ["Scope 1 (직접배출)",  f"{s1:,.1f}", pct(s1), krw_s(s1)],
        ["Scope 2 (전기 간접)", f"{s2:,.1f}", pct(s2), krw_s(s2)],
        ["Scope 3 (기타 간접)", f"{s3:,.1f}", pct(s3), krw_s(s3)],
        ["합계", f"{grand:,.1f}", "100%", f"{ed.cost_total_krw:,}"],
    ], colWidths=[5.5*cm, 4*cm, 2.5*cm, 4*cm])
    t2.setStyle(tbl_style(has_bold_last=True))
    story += [t2, Spacer(1, 0.4*cm)]
    for key in ("emission_analysis", "scope_breakdown"):
        txt = llm_text.get(key, "")
        if txt:
            story.append(Paragraph(txt, s_body))
    story.append(Spacer(1, 0.3*cm))

    # ④ 3장. 배출원 상세
    story.append(Paragraph("3장. 배출원 상세", s_section))
    cb = ed.category_breakdown or {}
    elec = cb.get("electricity",0); stat = cb.get("stationary_fuel",0)
    mob = cb.get("mobile_combustion",0); waste = cb.get("waste",0); water = cb.get("water",0)
    t3 = Table([
        ["카테고리","Scope","배출량 (kgCO₂e)","비중"],
        ["전기 사용","Scope 2",f"{elec:,.1f}", pct(elec)],
        ["고정 연소","Scope 1",f"{stat:,.1f}", pct(stat)],
        ["이동 연소","Scope 1",f"{mob:,.1f}",  pct(mob)],
        ["폐기물",   "Scope 3",f"{waste:,.1f}",pct(waste)],
        ["용수",     "Scope 3",f"{water:,.1f}",pct(water)],
    ], colWidths=[5.5*cm, 3*cm, 4*cm, 3.5*cm])
    t3.setStyle(tbl_style())
    story += [t3, Spacer(1, 0.3*cm)]

    # ⑤ 4장. K-ETS 리스크 평가
    story.append(Paragraph("4장. K-ETS 리스크 평가", s_section))
    risk_txt = llm_text.get("risk_assessment", "")
    if risk_txt:
        story.append(Paragraph(risk_txt, s_body))
    six_cost = sum(req.baseline_forecast)/1000*k_ets if req.baseline_forecast else 0
    t4 = Table([
        ["항목","수치"],
        ["월간 탄소 비용",      f"{ed.cost_total_krw:,}원"],
        ["6개월 누적 예상 비용", f"{round(six_cost):,}원"],
        ["K-ETS 단가",         f"{k_ets:,}원/tCO₂e"],
    ], colWidths=[8*cm, 8*cm])
    t4.setStyle(tbl_style())
    story += [t4, Spacer(1, 0.3*cm)]

    # ⑥ 5장. AI 감축 시나리오 비교
    story.append(Paragraph("5장. AI 감축 시나리오 비교", s_section))
    sc_rec_txt = llm_text.get("scenario_recommendation", "")
    if sc_rec_txt:
        story.append(Paragraph(sc_rec_txt, s_body))
    sc_map2 = {s.id: s for s in req.scenarios}
    sa2, sb2, sc2_ = sc_map2.get('A'), sc_map2.get('B'), sc_map2.get('C')

    def sc_v(s: Optional[_ReportScenario], field: str) -> str:
        if s is None: return "-"
        v = getattr(s, field, None)
        if field == 'recommended':    return "★ 추천" if v else "-"
        if field == 'difficulty':     return {'low':'쉬움','medium':'보통','high':'어려움'}.get(str(v),str(v))
        if field == 'payback_months':
            pm = float(v or 0)
            if pm >= 9999: return "회수 불가"
            return f"{int(pm//12)}년 {int(pm%12)}개월" if pm >= 12 else f"{int(pm)}개월"
        return f"{v:,.0f}" if isinstance(v,(int,float)) else (str(v) if v else "-")

    t5_data = [
        ["구분","시나리오 A","시나리오 B","시나리오 C"],
        ["전략명",            sc_v(sa2,'name'),              sc_v(sb2,'name'),              sc_v(sc2_,'name')],
        ["난이도",            sc_v(sa2,'difficulty'),        sc_v(sb2,'difficulty'),        sc_v(sc2_,'difficulty')],
        ["6개월 절감량(kg)",  sc_v(sa2,'co2_reduction_kg'),  sc_v(sb2,'co2_reduction_kg'),  sc_v(sc2_,'co2_reduction_kg')],
        ["6개월 절감비용(원)",sc_v(sa2,'cost_saving_krw'),   sc_v(sb2,'cost_saving_krw'),   sc_v(sc2_,'cost_saving_krw')],
        ["투자비용(원)",      sc_v(sa2,'investment_cost_krw'),sc_v(sb2,'investment_cost_krw'),sc_v(sc2_,'investment_cost_krw')],
        ["회수기간",          sc_v(sa2,'payback_months'),    sc_v(sb2,'payback_months'),    sc_v(sc2_,'payback_months')],
        ["AI 추천",           sc_v(sa2,'recommended'),       sc_v(sb2,'recommended'),       sc_v(sc2_,'recommended')],
    ]
    ts5 = tbl_style()
    for col_i, s_obj in enumerate([sa2, sb2, sc2_], start=1):
        if s_obj and s_obj.recommended:
            for row_i in range(1, len(t5_data)):
                ts5.add('BACKGROUND', (col_i, row_i), (col_i, row_i), LIGHT_GREEN)
    t5 = Table(t5_data, colWidths=[4*cm, 4*cm, 4*cm, 4*cm])
    t5.setStyle(ts5)
    story += [t5, Spacer(1, 0.3*cm)]

    # ⑦ 6장. 종합 결론
    story.append(Paragraph("6장. 종합 결론", s_section))
    conc = llm_text.get("conclusion", "")
    if conc:
        story.append(Paragraph(conc, s_body))

    def footer_cb(canvas, doc):
        canvas.saveState()
        canvas.setFont(fn, 8)
        canvas.setFillColor(HexColor('#888888'))
        canvas.drawCentredString(
            A4[0]/2, 1.2*cm,
            f"COCO 플랫폼 자동 생성  |  {ts}  |  K-ETS 기준: {k_ets:,}원/톤  |  페이지 {doc.page}",
        )
        canvas.restoreState()

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        topMargin=2*cm, bottomMargin=2.5*cm,
        leftMargin=2.5*cm, rightMargin=2.5*cm,
    )
    doc.build(story, onFirstPage=footer_cb, onLaterPages=footer_cb)
    return filepath


@app.post("/company-report")
def company_report(req: CompanyReportRequest):
    """
    기업 ESG 탄소배출 보고서 PDF 생성.
    1) Claude API로 보고서 텍스트 5섹션 생성
    2) ReportLab으로 PDF 렌더링 → generated_reports/ 에 저장
    """
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=503, detail="reportlab not installed. Run: pip install reportlab")

    ts    = datetime.now().strftime("%Y년 %m월 %d일 %H:%M")
    model = _env("CLAUDE_SCENARIO_MODEL") or _env("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

    # Claude 보고서 텍스트 생성
    llm_text: dict = {}
    print(f"[AI] /company-report Claude 호출 (model={model})", flush=True)
    content = _call_claude_ex(_build_report_prompt(req),
                              system_prompt=REPORT_SYSTEM_PROMPT,
                              model=model, max_tokens=2000)
    if content:
        cleaned = re.sub(r"^```(?:json)?\s*", "", content.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r"```\s*$", "", cleaned).strip()
        try:
            llm_text = json.loads(cleaned)
            print("[AI] /company-report LLM 텍스트 생성 완료", flush=True)
        except Exception as e:
            print(f"[AI] /company-report JSON 파싱 실패: {e}", flush=True)
    else:
        print("[AI] /company-report LLM 실패 → 텍스트 없이 PDF 생성", flush=True)

    # PDF 생성
    try:
        file_path = _build_esg_pdf(req, llm_text, ts)
        file_size = os.path.getsize(file_path)
        print(f"[AI] /company-report PDF 완료: {file_path} ({file_size} bytes)", flush=True)
        return {
            "status":          "ok",
            "file_path":       file_path,
            "file_name":       os.path.basename(file_path),
            "file_size_bytes": file_size,
            "font_warning":    not FONT_AVAILABLE,
        }
    except Exception as e:
        print(f"[AI] /company-report PDF 실패: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"PDF 생성 실패: {str(e)}")
