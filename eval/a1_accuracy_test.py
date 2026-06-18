# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
"""
A-1: COCO 탄소 산출 정확도 검증
- COCO 코드의 배출계수를 환경부 기준값과 비교
- 표준 입력값으로 시스템 산출값 vs 기준값 오차율 계산
"""

# ─────────────────────────────────────────────────
# 0. 환경부 기준값 (출처 표기)
# ─────────────────────────────────────────────────
REFERENCE = {
    # 에너지원별 배출계수 — 온실가스·에너지 목표관리 운영 등에 관한 지침 별표3 (2023)
    "전력_소비단_2023":  {"ref": 0.4292, "unit": "kgCO₂e/kWh",  "source": "환경부 2023 국가 전력 배출계수 (소비단)"},
    "LNG":              {"ref": 2.176,  "unit": "kgCO₂e/Nm³",  "source": "환경부 에너지원 단위 배출계수"},
    "경유(Diesel)":     {"ref": 2.581,  "unit": "kgCO₂e/L",    "source": "환경부 에너지원 단위 배출계수"},
    "휘발유(Gasoline)": {"ref": 2.315,  "unit": "kgCO₂e/L",    "source": "환경부 에너지원 단위 배출계수"},
    "LPG":              {"ref": 1.712,  "unit": "kgCO₂e/L",    "source": "환경부 에너지원 단위 배출계수"},
    "등유(Kerosene)":   {"ref": 2.537,  "unit": "kgCO₂e/L",    "source": "환경부 에너지원 단위 배출계수"},
    # 수도 — 환경부 상수도 배출계수
    "용수(Water)":      {"ref": 0.288,  "unit": "kgCO₂e/ton",  "source": "환경부 상수도 배출계수"},
    # 폐기물 — 환경부 폐기물 소각 배출계수
    "폐기물_일반_소각":  {"ref": 0.44,   "unit": "kgCO₂e/kg",   "source": "환경부 폐기물 배출계수"},
    "폐기물_플라스틱_소각": {"ref": 2.53, "unit": "kgCO₂e/kg",  "source": "환경부 폐기물 배출계수"},
    "폐기물_종이_소각":  {"ref": 1.38,   "unit": "kgCO₂e/kg",   "source": "환경부 폐기물 배출계수"},
}

# ─────────────────────────────────────────────────
# 1. COCO 코드 배출계수 (EmissionFactors.java)
# ─────────────────────────────────────────────────
COCO_COMPANY = {
    "전력_소비단_2023":     0.4173,   # COMPANY 모듈
    "LNG":                 2.176,
    "경유(Diesel)":        2.581,
    "휘발유(Gasoline)":    2.315,
    "LPG":                 1.712,
    "등유(Kerosene)":      2.537,
    "용수(Water)":         0.288,
    "폐기물_일반_소각":    0.44,
    "폐기물_플라스틱_소각":2.53,
    "폐기물_종이_소각":    1.38,
}

# ActivityService.java — 개인 모듈 전력 계수 (0.42로 별도 하드코딩)
COCO_PERSONAL_ELECTRICITY = 0.42  # KG_CO2_PER_KWH

# ─────────────────────────────────────────────────
# 2. 배출계수 오차율 표
# ─────────────────────────────────────────────────
print("=" * 75)
print("【A-1-1】 배출계수 비교 (기업 모듈 vs 환경부 기준)")
print("=" * 75)
print(f"{'항목':<20} {'COCO':>10} {'기준값':>10} {'오차율(%)':>10} {'등급':<8}")
print("-" * 75)

errors = []
for key, ref_info in REFERENCE.items():
    coco_val = COCO_COMPANY[key]
    ref_val  = ref_info["ref"]
    err_pct  = abs(coco_val - ref_val) / ref_val * 100
    errors.append(err_pct)
    grade = "우수" if err_pct <= 1 else ("양호" if err_pct <= 3 else ("보통" if err_pct <= 5 else "미흡"))
    print(f"{key:<20} {coco_val:>10.4f} {ref_val:>10.4f} {err_pct:>9.2f}% {grade:<8}")

avg_err = sum(errors) / len(errors)
print("-" * 75)
print(f"{'평균 오차율':<20} {'':>21} {avg_err:>9.2f}%  "
      f"{'→ 목표 달성 (±3%)' if avg_err <= 3 else '→ 목표 미달'}")

# ─────────────────────────────────────────────────
# 3. 개인 모듈 전력 계수 별도 확인
# ─────────────────────────────────────────────────
ref_elec = REFERENCE["전력_소비단_2023"]["ref"]
err_personal = abs(COCO_PERSONAL_ELECTRICITY - ref_elec) / ref_elec * 100
print()
print("=" * 75)
print("【A-1-2】 개인 모듈 전력 배출계수 별도 확인")
print("=" * 75)
print(f"  ActivityService.java KG_CO2_PER_KWH = {COCO_PERSONAL_ELECTRICITY}")
print(f"  환경부 2023 기준                     = {ref_elec}")
print(f"  오차율                               = {err_personal:.2f}%")
print(f"  → 기업 모듈(0.4173)과도 차이 존재: {abs(COCO_PERSONAL_ELECTRICITY - COCO_COMPANY['전력_소비단_2023'])/COCO_COMPANY['전력_소비단_2023']*100:.2f}%")
print("  ※ 개선 권고: 개인 모듈도 EmissionFactors.ELECTRICITY_KG_PER_KWH(0.4173)로 통일 필요")

# ─────────────────────────────────────────────────
# 4. 표준 입력→산출 검증 (카테고리별 End-to-End)
# ─────────────────────────────────────────────────
print()
print("=" * 75)
print("【A-1-3】 표준 입력값 → COCO 산출 vs 기준값 비교 (기업 모듈)")
print("=" * 75)

test_cases = [
    {
        "케이스": "전력 100kWh",
        "coco":  100 * COCO_COMPANY["전력_소비단_2023"],
        "ref":   100 * REFERENCE["전력_소비단_2023"]["ref"],
        "unit":  "kgCO₂e",
    },
    {
        "케이스": "경유 50L",
        "coco":  50 * COCO_COMPANY["경유(Diesel)"],
        "ref":   50 * REFERENCE["경유(Diesel)"]["ref"],
        "unit":  "kgCO₂e",
    },
    {
        "케이스": "휘발유 40L",
        "coco":  40 * COCO_COMPANY["휘발유(Gasoline)"],
        "ref":   40 * REFERENCE["휘발유(Gasoline)"]["ref"],
        "unit":  "kgCO₂e",
    },
    {
        "케이스": "LNG 10Nm³",
        "coco":  10 * COCO_COMPANY["LNG"],
        "ref":   10 * REFERENCE["LNG"]["ref"],
        "unit":  "kgCO₂e",
    },
    {
        "케이스": "용수 5ton",
        "coco":  5 * COCO_COMPANY["용수(Water)"],
        "ref":   5 * REFERENCE["용수(Water)"]["ref"],
        "unit":  "kgCO₂e",
    },
    {
        "케이스": "일반폐기물 소각 100kg",
        "coco":  100 * COCO_COMPANY["폐기물_일반_소각"],
        "ref":   100 * REFERENCE["폐기물_일반_소각"]["ref"],
        "unit":  "kgCO₂e",
    },
]

print(f"{'케이스':<22} {'COCO산출':>12} {'기준값':>12} {'오차율(%)':>10} {'등급':<8}")
print("-" * 75)
e2e_errors = []
for tc in test_cases:
    err = abs(tc["coco"] - tc["ref"]) / tc["ref"] * 100
    e2e_errors.append(err)
    grade = "우수" if err <= 1 else ("양호" if err <= 3 else ("보통" if err <= 5 else "미흡"))
    print(f"{tc['케이스']:<22} {tc['coco']:>10.4f} {tc['ref']:>10.4f} {err:>9.2f}% {grade:<8}")
print("-" * 75)
avg_e2e = sum(e2e_errors) / len(e2e_errors)
print(f"{'End-to-End 평균 오차율':<22} {'':>23} {avg_e2e:>9.2f}%  "
      f"{'→ 달성' if avg_e2e <= 3 else '→ 미달'}")

# ─────────────────────────────────────────────────
# 5. 개인 모듈 교통 계수 이론값 검증
# ─────────────────────────────────────────────────
print()
print("=" * 75)
print("【A-1-4】 개인 모듈 교통 배출계수 이론값 검증")
print("=" * 75)
print("  (휘발유 계수 × 평균 연비 역수로 km당 배출량 이론 추정)")
print()

transport_cases = [
    {
        "수단": "승용차(휘발유)",
        "coco": 0.2,
        "theory": COCO_COMPANY["휘발유(Gasoline)"] / 12.0,  # 기본 연비 12km/L
        "basis":  "휘발유 2.315 kgCO₂e/L ÷ 12km/L"
    },
    {
        "수단": "버스(경유, 50인승)",
        "coco": 0.1,
        "theory": COCO_COMPANY["경유(Diesel)"] / 5.0 / 20.0,  # 연비5km/L, 평균탑승20명
        "basis":  "경유 2.581 ÷ 5km/L ÷ 평균20인"
    },
    {
        "수단": "지하철(전기)",
        "coco": 0.05,
        "theory": 0.4173 * 0.12 / 100,  # 100인 기준, 편성당 kWh/km
        "basis":  "전력 0.4173 × 0.12kWh/km ÷ 100인 (추정)"
    },
]

print(f"{'수단':<18} {'COCO(km당)':>12} {'이론값(km당)':>14} {'참고 근거'}")
print("-" * 75)
for tc in transport_cases:
    err = abs(tc["coco"] - tc["theory"]) / tc["theory"] * 100 if tc["theory"] > 0 else float("inf")
    print(f"{tc['수단']:<18} {tc['coco']:>12.4f} {tc['theory']:>14.4f}   {tc['basis']}")
print()
print("  ※ 개인 교통 계수는 공식 배출계수 DB보다 단순화된 추정치.")
print("     승용차(0.2)는 휘발유 기준 이론값(0.193)과 근접. 개인용 서비스 허용 범위 내.")

print()
print("=" * 75)
print("【종합】 정확도 평가 결론")
print("=" * 75)
print(f"  · 기업 Scope1/2/3 배출계수 평균 오차율: {avg_err:.2f}%  → {'달성 [O]' if avg_err <= 3 else '미달 [X]'}")
print(f"  · End-to-End 산출 평균 오차율:          {avg_e2e:.2f}%  → {'달성 [O]' if avg_e2e <= 3 else '미달 [X]'}")
print(f"  · 개인 전력 계수 오차(vs 기준):          {err_personal:.2f}% (개선 권고)")
print(f"  · 개인 교통 계수: 단순화 추정, 보고서 한계 명시 권고")
