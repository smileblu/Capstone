# -*- coding: utf-8 -*-
"""
B-2: LLM 시나리오 출력 안정성 테스트 (10회 호출)
C-1: purpose별 시나리오 방향성 분기 확인 (3회 호출)
"""
import sys, io, os, json, re, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'apps', 'AI')))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'apps', 'AI', '.env'))

import httpx

API_KEY     = os.getenv("CLAUDE_API_KEY", "")
BASE_URL    = os.getenv("CLAUDE_BASE_URL", "https://api.anthropic.com")
MODEL       = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
TIMEOUT     = int(os.getenv("CLAUDE_TIMEOUT_SEC", "20"))

SYSTEM_PROMPT = """당신은 중소기업 탄소 감축 전문 컨설턴트입니다.
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

REQUIRED_FIELDS_SCENARIO = ["id", "name", "label", "description", "difficulty", "feasibility", "actions"]
REQUIRED_FIELDS_ACTION   = ["target_category", "action_desc", "reduction_rate", "investment_cost_krw", "payback_months"]

FIXED_EMISSION = {
    "electricity": 0.62,
    "fuel":        0.28,
    "waste":       0.06,
    "water":       0.04,
}

def build_prompt(purpose: str, industry: str = "제조업", employee: int = 80) -> str:
    purpose_map = {
        "internal":        "내부 비용 절감 중심",
        "customer_submit": "고객사 제출 대응",
        "esg_compliance":  "ESG 규제 대응",
    }
    label = purpose_map.get(purpose, purpose)
    cw = FIXED_EMISSION
    return (
        f"기업 정보:\n"
        f"- 업종: {industry} / 공장형 / 직원 {employee}명\n"
        f"- 온보딩 목적: {label} ({purpose})\n\n"
        f"배출 현황:\n"
        f"- 최근 3개월 평균: 62,400.0 kgCO₂e/월\n"
        f"- 전년 대비: +8.2% 증가 중\n"
        f"- 카테고리 비중: 전기 {cw['electricity']*100:.0f}%, 연료 {cw['fuel']*100:.0f}%, "
        f"폐기물 {cw['waste']*100:.0f}%, 용수 {cw['water']*100:.0f}%\n"
        f"- 주요 연료: 경유, LNG\n\n"
        f"비용 현황:\n"
        f"- 월 탄소 비용: 748,800원\n"
        f"- K-ETS 시장가: 12,000원/kgCO₂e\n\n"
        f"6개월 예측 (ARIMA, tCO₂e): [62.1, 63.4, 61.8, 64.2, 65.0, 63.7]\n"
    )

def call_claude(prompt: str) -> tuple[dict | None, float, str | None]:
    """(parsed_json | None, elapsed_sec, raw_text | None)"""
    headers = {
        "x-api-key":         API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
    }
    payload = {
        "model":      MODEL,
        "max_tokens": 2048,
        "system":     SYSTEM_PROMPT,
        "messages":   [{"role": "user", "content": prompt}],
    }
    url = f"{BASE_URL}/v1/messages"
    t0 = time.time()
    try:
        with httpx.Client(timeout=TIMEOUT) as c:
            r = c.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        elapsed = time.time() - t0
        raw = (data.get("content") or [{}])[0].get("text", "")
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), re.IGNORECASE)
        cleaned = re.sub(r"```\s*$", "", cleaned).strip()
        obj = json.loads(cleaned)
        return obj, elapsed, raw
    except Exception as e:
        return None, time.time() - t0, str(e)

def validate_scenario(obj: dict) -> tuple[bool, bool, list[str]]:
    """(has_required_fields, rate_in_range, issues)"""
    if not isinstance(obj, dict) or "scenarios" not in obj:
        return False, False, ["scenarios 키 없음"]
    issues = []
    rate_ok = True
    field_ok = True
    for s in obj.get("scenarios", []):
        for f in REQUIRED_FIELDS_SCENARIO:
            if f not in s:
                issues.append(f"시나리오 필드 누락: {f}")
                field_ok = False
        for a in s.get("actions", []):
            for f in REQUIRED_FIELDS_ACTION:
                if f not in a:
                    issues.append(f"action 필드 누락: {f}")
                    field_ok = False
            try:
                rr = float(a.get("reduction_rate", -1))
                if not (0.0 <= rr <= 1.0):
                    issues.append(f"reduction_rate 범위 초과: {rr}")
                    rate_ok = False
            except (TypeError, ValueError):
                issues.append("reduction_rate 파싱 실패")
                rate_ok = False
    return field_ok, rate_ok, issues

# ─────────────────────────────────────────────────────────────────────────────
# B-2: 10회 안정성 테스트
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 75)
print("【B-2】 LLM 시나리오 출력 안정성 테스트 (10회)")
print(f"  모델: {MODEL}  |  엔드포인트: {BASE_URL}")
print("=" * 75)

industries = ["제조업","IT·소프트웨어","유통·물류","음식·외식","건설","제조업","화학","제조업","서비스","제조업"]
purposes   = ["internal","esg_compliance","customer_submit","internal","esg_compliance",
              "customer_submit","internal","esg_compliance","customer_submit","internal"]

results = []
print(f"\n  {'회차':>4} {'업종':<16} {'purpose':<18} {'필드':>5} {'범위':>5} {'응답시간':>8} {'비고'}")
print("  " + "-" * 71)

for i in range(10):
    prompt = build_prompt(purposes[i], industries[i])
    obj, elapsed, raw = call_claude(prompt)

    if obj is None:
        field_ok, rate_ok = False, False
        issues = [str(raw)[:60]]
    else:
        field_ok, rate_ok, issues = validate_scenario(obj)

    results.append({
        "field_ok": field_ok, "rate_ok": rate_ok,
        "elapsed": elapsed, "issues": issues,
    })
    f_str = "[O]" if field_ok else "[X]"
    r_str = "[O]" if rate_ok  else "[X]"
    note  = issues[0][:35] if issues else "정상"
    print(f"  {i+1:>4} {industries[i]:<16} {purposes[i]:<18} {f_str:>5} {r_str:>5} {elapsed:>7.1f}s  {note}")

field_rate  = sum(1 for r in results if r["field_ok"]) / len(results) * 100
rate_rate   = sum(1 for r in results if r["rate_ok"])  / len(results) * 100
avg_elapsed = sum(r["elapsed"] for r in results) / len(results)

print()
print("=" * 75)
print("【B-2 통계】")
print("=" * 75)
print(f"  필수 필드 완전 출력률:    {field_rate:.0f}%   (기준: 90% 이상  → {'달성 [O]' if field_rate >= 90 else '미달 [X]'})")
print(f"  reduction_rate 범위 준수: {rate_rate:.0f}%   (기준: 100%      → {'달성 [O]' if rate_rate == 100 else '미달 [X]'})")
print(f"  평균 응답시간:            {avg_elapsed:.1f}s  (기준: 5초 이내  → {'달성 [O]' if avg_elapsed <= 5 else '미달 [X]'})")

# ─────────────────────────────────────────────────────────────────────────────
# C-1: purpose별 방향성 분기 확인 (동일 데이터, purpose만 변경)
# ─────────────────────────────────────────────────────────────────────────────
print()
print("=" * 75)
print("【C-1】 시나리오 맞춤성 — purpose별 방향성 분기 (동일 데이터)")
print("  배출 비중: 전기 62% / 연료 28% / 폐기물 6% / 용수 4% (고정)")
print("=" * 75)

PURPOSE_EXPECTED = {
    "internal":        "투자 대비 비용 절감 (ROI 최대화)",
    "esg_compliance":  "K-ETS 리스크 해소 (과징금 회피)",
    "customer_submit": "Scope 커버리지 확보 (데이터 신뢰도)",
}

c1_results = {}
for purpose in ["internal", "esg_compliance", "customer_submit"]:
    prompt = build_prompt(purpose)
    obj, elapsed, raw = call_claude(prompt)
    c1_results[purpose] = {"obj": obj, "elapsed": elapsed}
    print(f"\n  [{purpose}]  ({elapsed:.1f}s)")
    if obj and "scenarios" in obj:
        for s in obj["scenarios"]:
            print(f"    시나리오 {s.get('id','?')} — {s.get('name','?')}: {s.get('description','?')}")
            for a in s.get("actions", []):
                print(f"      └ [{a.get('target_category','?')}] {a.get('action_desc','?')[:40]}"
                      f"  (감축률 {a.get('reduction_rate',0)*100:.0f}%"
                      f"  투자비 {a.get('investment_cost_krw',0):,}원"
                      f"  회수 {a.get('payback_months',0)}개월)")
    else:
        print(f"    [실패] {str(raw)[:60]}")

print()
print("=" * 75)
print("【C-1 방향성 분기 평가】")
print("=" * 75)
print(f"  {'purpose':<20} {'기대 방향':<35} {'생성 여부':>8}")
print("  " + "-" * 68)
for p, exp in PURPOSE_EXPECTED.items():
    r = c1_results.get(p, {})
    ok = r.get("obj") is not None and "scenarios" in r.get("obj", {})
    print(f"  {p:<20} {exp:<35} {'생성 [O]' if ok else '실패 [X]':>8}")

print()
print("  ※ 방향성 분기의 정성적 검증은 위 세부 출력을 참고하여 수동 확인 필요")
