# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

"""
B-1: 예외 입력 처리 안정성 — 코드 정적 분석 기반 결과
소스: ExcelUploadService.java, main.py
"""

print("=" * 80)
print("【B-1】 예외 입력 처리 안정성 — 정적 분석 결과")
print("=" * 80)

cases = [
    {
        "no": 1,
        "케이스": "엑셀 형식 오류 (비.xlsx 파일 또는 손상된 파일)",
        "처리_위치": "ExcelUploadService.java:86",
        "코드": "catch (IOException e) { throw new GeneralException(BAD_REQUEST); }",
        "기대_동작": "HTTP 400 오류 안내 + 재업로드 유도",
        "실제_동작": "HTTP 400 응답 (서비스 중단 없음)",
        "fallback": "재업로드 안내 메시지",
        "통과": True,
        "비고": "XSSFWorkbook 파싱 실패 즉시 캐치"
    },
    {
        "no": 2,
        "케이스": "비현실 수치 입력 (전기 999,999 kWh)",
        "처리_위치": "ExcelUploadService.java:125",
        "코드": "if (usageKwh < 0) { errors.add(...); continue; }",
        "기대_동작": "경고 안내 + 입력값 재확인 요청",
        "실제_동작": "상한선 검증 없음 → 정상 처리 (999,999kWh 그대로 저장)",
        "fallback": "없음 (저장 완료로 처리됨)",
        "통과": False,
        "비고": "[개선 필요] 상한선 검증 로직 추가 권고 (예: 10만 kWh 초과 시 경고)"
    },
    {
        "no": 3,
        "케이스": "필수 항목 누락 (billing_month 또는 사용량 비어있음)",
        "처리_위치": "ExcelUploadService.java:474-496",
        "코드": "validateRequired() → errors.add(); continue;",
        "기대_동작": "해당 행 스킵 + 오류 목록 반환",
        "실제_동작": "해당 행 DB 저장 건너뜀, errors 리스트에 행·필드·사유 포함",
        "fallback": "ExcelUploadResponse.errors[] 로 오류 상세 반환 (row, field, reason)",
        "통과": True,
        "비고": "나머지 유효한 행은 정상 저장 (부분 성공 지원)"
    },
    {
        "no": 4,
        "케이스": "데이터 부족 — 2개월 미만 (예측 불가 상황)",
        "처리_위치": "main.py:700-716 (/company-baseline)",
        "코드": "if n < 6: ... status='insufficient', model_used='linear_fallback'",
        "기대_동작": "예측 비활성화 + '데이터 부족' 안내",
        "실제_동작": "선형 외삽 fallback 예측값 반환, status='insufficient' 명시",
        "fallback": "마지막 값 기준 10% 감소 선형 추정 6개월 반환",
        "통과": True,
        "비고": "6개월 미만 전체 해당. 2개월도 동일 분기 처리됨"
    },
    {
        "no": 5,
        "케이스": "LLM 응답 오류 — reduction_rate 1.0 초과",
        "처리_위치": "main.py:875-881 (_validate_company_scenarios)",
        "코드": "if not 0.0 <= rr <= 1.0: return False → 재시도",
        "기대_동작": "응답 무효 처리 + 기본 시나리오 제공",
        "실제_동작": "검증 실패 → 3회 재시도 → 전부 실패 시 {error: scenario_generation_failed}",
        "fallback": "에러 객체 반환 (기본 시나리오 없음 — 개선 필요)",
        "통과": "부분",
        "비고": "[개선 권고] 3회 실패 시 하드코딩 기본 시나리오 반환 추가 필요"
    },
    {
        "no": 6,
        "케이스": "Claude API 3회 연속 실패",
        "처리_위치": "main.py:899-918 (for attempt in range(3))",
        "코드": "for attempt in range(3): ... return {'error': 'scenario_generation_failed'}",
        "기대_동작": "재시도 후 fallback 시나리오 반환",
        "실제_동작": "3회 재시도 후 에러 객체 반환 (fallback 시나리오 없음)",
        "fallback": "에러 객체 반환 — BE가 이를 처리해 기본 시나리오 표시",
        "통과": "부분",
        "비고": "[확인 필요] BE(AiPredictClient.java)의 에러 응답 처리 방식 추가 검증 필요"
    },
    {
        "no": 7,
        "케이스": "개인 시나리오 reduction_rate 범위 초과 (>0.50)",
        "처리_위치": "main.py:228-230 (_parse_personalize_response)",
        "코드": "rr = max(0.05, min(rr, 0.50))",
        "기대_동작": "범위 자동 클램핑",
        "실제_동작": "0.05~0.50 범위로 자동 클램핑 (크래시 없음)",
        "fallback": "클램핑 후 정상 응답",
        "통과": True,
        "비고": "기업 시나리오(0~1.0)와 개인 시나리오(0.05~0.50) 기준이 다름 — 의도적 설계"
    },
]

# ── 결과 표 ──────────────────────────────────────────────────────────────────
print()
print(f"{'#':<3} {'케이스':<30} {'통과':^6} {'fallback 동작'}")
print("-" * 80)
for c in cases:
    통과 = "[O]" if c["통과"] is True else ("[-]" if c["통과"] == "부분" else "[X]")
    print(f"{c['no']:<3} {c['케이스']:<30} {통과:^6}  {c['fallback']}")

# ── 세부 분석 ────────────────────────────────────────────────────────────────
print()
print("=" * 80)
print("【세부 분석 — 케이스별】")
print("=" * 80)
for c in cases:
    통과 = "달성 [O]" if c["통과"] is True else ("부분 달성 [-]" if c["통과"] == "부분" else "미달 [X]")
    print(f"\n  Case {c['no']}: {c['케이스']}")
    print(f"  위치  : {c['처리_위치']}")
    print(f"  코드  : {c['코드']}")
    print(f"  기대  : {c['기대_동작']}")
    print(f"  실제  : {c['실제_동작']}")
    print(f"  판정  : {통과}")
    if c["비고"]:
        print(f"  비고  : {c['비고']}")

# ── 종합 ─────────────────────────────────────────────────────────────────────
pass_count    = sum(1 for c in cases if c["통과"] is True)
partial_count = sum(1 for c in cases if c["통과"] == "부분")
fail_count    = sum(1 for c in cases if c["통과"] is False)

print()
print("=" * 80)
print("【종합 결과】")
print("=" * 80)
print(f"  전체 케이스: {len(cases)}개")
print(f"  완전 달성  : {pass_count}개")
print(f"  부분 달성  : {partial_count}개  (개선 권고 항목)")
print(f"  미달       : {fail_count}개")
print()
print("  핵심 개선 필요 사항:")
print("  1. Case 2: 비현실 수치 상한선 검증 (전기 > 100,000 kWh 등)")
print("  2. Case 5/6: LLM/API 3회 실패 시 하드코딩 기본 시나리오 fallback 구현")
print("  3. Case 6: BE의 scenario_generation_failed 에러 처리 방식 프론트 노출 확인")
print()
print("  서비스 중단 발생 케이스: 0개 (모든 케이스에서 크래시 없음)")
