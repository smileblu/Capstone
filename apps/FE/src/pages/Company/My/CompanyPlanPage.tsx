import { Check, CreditCard } from "lucide-react";
import CompanyPageHeader from "../CompanyPageHeader";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "무료",
    features: ["탄소 배출 기본 조회", "월 1회 보고서 생성", "1개 사업장"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "월 29,000원",
    features: ["탄소 배출 상세 분석", "무제한 보고서 생성", "최대 5개 사업장", "ESG 보고서 템플릿"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "문의",
    features: ["전체 기능 무제한", "전담 컨설팅 지원", "무제한 사업장", "맞춤형 보고서"],
  },
];

export default function CompanyPlanPage() {
  const currentPlan = "free";

  // TODO: 백엔드 연결 시 실제 데이터로 교체
  const billing = {
    method: null as string | null,   // 예: "신한카드 1234"
    nextDate: null as string | null, // 예: "2026-06-01"
  };

  return (
    <div>
      {/* 상단 바 */}
      <CompanyPageHeader title="플랜" showBack />

      {/* 결제 정보 */}
      <div className="mt-8">
        <div className="pl-2 title1 text-[var(--color-black)]">결제 정보</div>
        <div className="mt-3 rounded-[12px] border border-[var(--color-grey-350)] bg-white px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[var(--color-grey-550)]" />
              <span className="body1 text-[var(--color-grey-550)]">결제 수단</span>
            </div>
            {billing.method ? (
              <span className="body1 text-[var(--color-grey-750)]">{billing.method}</span>
            ) : (
              <button
                type="button"
                className="caption1 text-[var(--color-green)] active:opacity-70"
              >
                등록하기
              </button>
            )}
          </div>
          <div className="h-px bg-[var(--color-grey-250)]" />
          <div className="flex items-center justify-between">
            <span className="body1 text-[var(--color-grey-550)]">다음 결제일</span>
            <span className="body1 text-[var(--color-grey-750)]">
              {billing.nextDate ?? (currentPlan === "free" ? "해당 없음" : "-")}
            </span>
          </div>
        </div>
      </div>

      {/* 플랜 목록 */}
      <div className="mt-7">
        <div className="pl-2 title1 text-[var(--color-black)]">플랜 선택</div>
      </div>
      <div className="mt-3 space-y-4">
        {PLANS.map((plan) => {
          const isActive = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={cx(
                "rounded-[12px] border px-4 py-4",
                isActive
                  ? "border-[var(--color-green)] bg-[#F0F7E8]"
                  : "border-[var(--color-grey-350)] bg-white",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="label1 text-[var(--color-black)]">{plan.name}</div>
                {isActive && (
                  <span className="caption1 rounded-full bg-[var(--color-green)] px-2 py-0.5 text-white">
                    현재 플랜
                  </span>
                )}
              </div>
              <div className="mt-1 body1 text-[var(--color-grey-550)]">{plan.price}</div>
              <div className="mt-3 space-y-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[var(--color-green)]" />
                    <span className="caption2 text-[var(--color-grey-750)]">{f}</span>
                  </div>
                ))}
              </div>
              {!isActive && (
                <button
                  type="button"
                  className="mt-4 w-full h-10 rounded-[12px] bg-[var(--color-green)] label2 text-white active:scale-[0.99] transition-all duration-150"
                >
                  {plan.id === "enterprise" ? "문의하기" : "업그레이드"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-6" />
    </div>
  );
}
