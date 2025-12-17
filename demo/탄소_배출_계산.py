# emission_factors.csv 생성
CSV_TEXT = """category,subcategory,unit,factor_kg_per_unit,source
electricity,home_electricity,kWh,0.466,KECO_2022
electricity,industrial,kWh,0.459,KECO_2022
transport,car_gasoline,km,0.192,IPCC_KR_LCI
transport,car_diesel,km,0.171,IPCC_KR_LCI
transport,bus,km,0.089,Keco_LCA
transport,subway,km,0.013,SeoulMetro_LCA
delivery,food_delivery_motorbike,km,0.090,ASSUMPTION_DELIVERY
"""

CSV_PATH = "/content/emission_factors.csv"
with open(CSV_PATH, "w", encoding="utf-8") as f:
    f.write(CSV_TEXT)

print("[INFO] Saved:", CSV_PATH)

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel
from typing import Dict, Tuple, List, Optional, Any
from collections import defaultdict
from datetime import datetime, timezone
import csv, os, uuid, json

from IPython.display import display, Markdown

# App + TestClient (uvicorn 코랩에서 잘 실행이 안 됨..))
app = FastAPI(title="PlanIT Carbon API (TestClient)")
client = TestClient(app)

# Schemas
class ActivityRecord(BaseModel):
    user_id: str
    user_type: str                  # individual/company
    pricing_mode: Optional[str] = None
    category: str                   # electricity/transport/delivery
    subcategory: str
    value: float
    unit: str

class BatchActivity(BaseModel):
    category: str
    subcategory: str

    value: float = 0.0

    order_count: Optional[int] = None
    avg_km_per_order: Optional[float] = None

class BatchRequest(BaseModel):
    user_id: str
    user_type: str
    pricing_mode: Optional[str] = None
    activities: List[BatchActivity]

# Factors & Pricing
EMISSION_FACTORS: Dict[Tuple[str, str, str], float] = {}
EMISSION_FACTOR_SOURCE: Dict[Tuple[str, str, str], str] = {}

DEFAULT_EMISSION_FACTOR = 0.0003
DEFAULT_FACTOR_SOURCE = "DEFAULT_FACTOR"

CARBON_PRICES: Dict[Tuple[str, str], float] = {
    ("individual", "offset"): 30000.0,
    ("individual", "social"): 200000.0,
    ("company", "ets"): 80000.0,
    ("company", "internal"): 120000.0,
}

DEFAULT_CARBON_PRICE_PER_TON_KRW = 100000.0
DEFAULT_PRICING_MODE = "default"
DEFAULT_PRICE_SOURCE = "DEFAULT_PRICE"

DEFAULT_DELIVERY_AVG_KM_PER_ORDER = 3.0


# Demo storage (DB 흉내..)
RECORDS: List[Dict[str, Any]] = []

# Load CSV
def load_emission_factors_from_csv(csv_path: str):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Emission factor CSV not found: {csv_path}")

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            category = (row.get("category") or "").strip()
            subcategory = (row.get("subcategory") or "").strip()
            unit = (row.get("unit") or "").strip()
            factor_str = (row.get("factor_kg_per_unit") or "").strip()
            source = (row.get("source") or "").strip() or "UNKNOWN_SOURCE"
            if not category or not subcategory or not unit or not factor_str:
                continue
            factor = float(factor_str)
            key = (category, subcategory, unit)
            EMISSION_FACTORS[key] = factor
            EMISSION_FACTOR_SOURCE[key] = source
            count += 1
    print(f"[INFO] Loaded {count} emission factors from {csv_path}")

load_emission_factors_from_csv("/content/emission_factors.csv")

# Helpers

def simple_input_check(act: BatchActivity) -> List[str]:
    warnings = []

    if act.category in ("electricity", "transport"):
        if act.value is None:
            warnings.append(f"[WARN] {act.category}/{act.subcategory}: value is missing")
        elif act.value < 0:
            warnings.append(f"[WARN] {act.category}/{act.subcategory}: negative value ({act.value})")

    if act.category == "delivery":
        if act.order_count is None:
            warnings.append("[WARN] delivery: order_count is missing")
        elif act.order_count < 0:
            warnings.append(f"[WARN] delivery: negative order_count ({act.order_count})")

        if act.avg_km_per_order is not None and act.avg_km_per_order < 0:
            warnings.append(f"[WARN] delivery: negative avg_km_per_order ({act.avg_km_per_order})")

    return warnings


def get_emission_factor(category: str, subcategory: str, unit: str):
    key = (category, subcategory, unit)
    factor = EMISSION_FACTORS.get(key)
    source = EMISSION_FACTOR_SOURCE.get(key)
    if factor is None:
        return DEFAULT_EMISSION_FACTOR, DEFAULT_FACTOR_SOURCE
    return factor, (source or "UNKNOWN_SOURCE")

def get_carbon_price(user_type: str, pricing_mode: Optional[str]):
    actor = (user_type or "").lower()
    mode = (pricing_mode or "").lower()

    if not mode:
        mode = "ets" if actor == "company" else "offset"

    price = CARBON_PRICES.get((actor, mode))
    if price is None:
        return DEFAULT_CARBON_PRICE_PER_TON_KRW, DEFAULT_PRICING_MODE, DEFAULT_PRICE_SOURCE

    return price, mode, f"{actor}_{mode}_pricing"

def normalize_delivery_to_km(act: BatchActivity) -> Tuple[float, str, Dict[str, Any]]:
    """
    return: (normalized_value, normalized_unit, meta_for_output)
    """
    if act.category != "delivery":
        return float(act.value), ("kWh" if act.category == "electricity" else "km"), {}

    if act.order_count is None:
        raise ValueError("delivery activity requires order_count")

    avg_km = act.avg_km_per_order if act.avg_km_per_order is not None else DEFAULT_DELIVERY_AVG_KM_PER_ORDER
    total_km = float(act.order_count) * float(avg_km)

    meta = {"order_count": int(act.order_count), "avg_km_per_order": float(avg_km)}
    return total_km, "km", meta

def calculate_emission_kg(activity: ActivityRecord):
    cat = activity.category
    sub = activity.subcategory
    value = activity.value

    if cat == "electricity":
        factor, source = get_emission_factor(cat, sub, "kWh")
        return value * factor, factor, source

    elif cat == "transport":
        factor, source = get_emission_factor(cat, sub, "km")
        return value * factor, factor, source

    elif cat == "delivery":
        factor, source = get_emission_factor(cat, sub, "km")
        return value * factor, factor, source

    factor, source = get_emission_factor(cat, sub, activity.unit)
    return value * factor, factor, source

def calculate_emission_and_cost(activity: ActivityRecord):
    emission_kg_raw, factor, factor_source = calculate_emission_kg(activity)
    emission_kg = round(emission_kg_raw, 6)
    emission_ton = round(emission_kg / 1000.0, 6)

    price_per_ton, pricing_mode_norm, price_source = get_carbon_price(
        activity.user_type, activity.pricing_mode
    )
    cost_krw = round(emission_ton * price_per_ton, 2)

    return {
        "emission_kg": emission_kg,
        "emission_ton": emission_ton,
        "cost_krw": cost_krw,
        "factor_kg_per_unit": factor,
        "factor_source": factor_source,
        "pricing_mode": pricing_mode_norm,
        "carbon_price_per_ton_krw": price_per_ton,
        "price_source": price_source,
    }

# API

@app.get("/")
def root():
    return {"message": "Carbon API is running (TestClient mode)"}

@app.post("/calculate-batch")
def calculate_batch(batch: BatchRequest):
    warnings_all = []
    activities_results = []

    category_kg_sum = defaultdict(float)
    category_cost_sum = defaultdict(float)

    total_emission_kg = 0.0
    total_emission_ton = 0.0
    total_cost_krw = 0.0

    price_per_ton, pricing_mode_norm, price_source = get_carbon_price(batch.user_type, batch.pricing_mode)

    for act in batch.activities:
        warnings_all += simple_input_check(act)

        # 음수면 즉시 중단
        if act.category in ("electricity", "transport"):
            if act.value is not None and act.value < 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Negative value not allowed: {act.category}/{act.subcategory} = {act.value}"
                )

        if act.category == "delivery":
            if act.order_count is not None and act.order_count < 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Negative order_count not allowed: {act.order_count}"
                )
            if act.avg_km_per_order is not None and act.avg_km_per_order < 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Negative avg_km_per_order not allowed: {act.avg_km_per_order}"
                )

        try:
            norm_value, norm_unit, meta = normalize_delivery_to_km(act)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        activity = ActivityRecord(
            user_id=batch.user_id,
            user_type=batch.user_type,
            pricing_mode=batch.pricing_mode,
            category=act.category,
            subcategory=act.subcategory,
            value=norm_value,
            unit=norm_unit,
        )

        r = calculate_emission_and_cost(activity)

        category_kg_sum[activity.category] += r["emission_kg"]
        category_cost_sum[activity.category] += r["cost_krw"]

        total_emission_kg += r["emission_kg"]
        total_emission_ton += r["emission_ton"]
        total_cost_krw += r["cost_krw"]

        activities_results.append({
            "category": activity.category,
            "subcategory": activity.subcategory,
            "unit": activity.unit,
            "value": activity.value,
            **meta,
            "emission_kg": r["emission_kg"],
            "emission_ton": r["emission_ton"],
            "cost_krw": r["cost_krw"],
            "factor_kg_per_unit": r["factor_kg_per_unit"],
            "factor_source": r["factor_source"],
        })

    category_summary = {}
    for cat in sorted(category_kg_sum.keys()):
        kg = category_kg_sum[cat]
        category_summary[cat] = {
            "emission_kg": round(kg, 6),
            "emission_ton": round(kg / 1000.0, 6),
            "cost_krw": round(category_cost_sum[cat], 2),
        }

    summary = {
        "total_emission_kg": round(total_emission_kg, 6),
        "total_emission_ton": round(total_emission_ton, 6),
        "total_cost_krw": round(total_cost_krw, 2),
    }

    record_id = str(uuid.uuid4())
    stored_at = datetime.now(timezone.utc).isoformat()

    record = {
        "record_id": record_id,
        "stored_at": stored_at,
        "user_id": batch.user_id,
        "user_type": batch.user_type,
        "pricing": {
            "pricing_mode": pricing_mode_norm,
            "carbon_price_per_ton_krw": price_per_ton,
            "price_source": price_source,
        },
        "activities": activities_results,
        "category_summary": category_summary,
        "summary": summary,
    }
    RECORDS.append(record)

    return {
        "message": "Calculated successfully.",
        "warnings": warnings_all,
        "pricing": record["pricing"],                 # pricing 1회
        "activities": activities_results,
        "category_summary": category_summary,         # category별 합계
        "summary": summary,                           # 전체 합계
    }

@app.get("/records")
def list_records(limit: int = 10):
    limit = max(1, min(limit, 100))
    return {"count": len(RECORDS), "records": RECORDS[-limit:][::-1]}

# 요약 카드 출력 함수

def render_summary_card(
    api_result,
    period_label=None,
    show_details=False
):

    s = api_result["summary"]
    p = api_result["pricing"]
    c = api_result["category_summary"]

    electricity_kg = c.get("electricity", {}).get("emission_kg", 0)
    delivery_kg = c.get("delivery", {}).get("emission_kg", 0)
    transport_kg = c.get("transport", {}).get("emission_kg", 0)

    header = "탄소 배출 요약"
    if period_label:
        header += f" ({period_label})"

    details_block = ""
    if show_details:
        details_json = json.dumps(
            api_result["activities"],
            ensure_ascii=False,
            indent=2
        )
        details_block = f"""

<details>
<summary><strong>상세 계산 내역 보기</strong></summary>

```json
{details_json}
```
</details> """
    md = f"""

    {header}

    [카테고리별 배출량]
    전기: {electricity_kg} kgCO₂e
    배달: {delivery_kg} kgCO₂e
    교통: {transport_kg} kgCO₂e

    [전체 결과]
    총 배출량: {s['total_emission_kg']} kgCO₂e
    금전 환산: {s['total_cost_krw']} KRW

    [탄소 가격 기준]
    Pricing Mode: `{p['pricing_mode']}`
    Carbon Price: {p['carbon_price_per_ton_krw']:,} KRW/t

    {details_block}
    """
    display(Markdown(md))

print("[INFO] Ready. Example: client.get('/').json()")

# 데이터 입력

period_label = "2025.12.17"

payload = {
  "user_id": "user_1",
  "user_type": "individual",
  "pricing_mode": "offset",
  "activities": [
    # 전기 사용량 (kWh)
    {
      "category": "electricity",
      "subcategory": "home_electricity",
      "value": 220
    },

    # 교통 - 지하철 (km)
    {
      "category": "transport",
      "subcategory": "subway",
      "value": 18
    },

    # 교통 - 차 (km)
    {
      "category": "transport",
      "subcategory": "car_gasoline",
      "value": 6
    },

    # 배달 (횟수 × 평균 거리)
    {
      "category": "delivery",
      "subcategory": "food_delivery_motorbike",
      "order_count": 7,
      "avg_km_per_order": 3.2
    }
  ]
}

resp = client.post("/calculate-batch", json=payload)
print("status:", resp.status_code)

if resp.status_code != 200:
    print("[ERROR]", resp.json())
else:
    data = resp.json()
    print("warnings:", data.get("warnings", []))
    render_summary_card(data, period_label=period_label, show_details=False)

import json
resp = client.get("/records?limit=5")
print(json.dumps(resp.json(), ensure_ascii=False, indent=2))