import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function RewardPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"전체" | "미션 전" | "미션 완료">("전체");

  return (
    <div className="pb-24">
      {/* --- 중앙 정렬 헤더 영역 --- */}
      <header className="relative flex h-10 items-center justify-center pt-2">
        {/* 왼쪽 뒤로가기 버튼: absolute로 띄워서 중앙 정렬에 영향을 주지 않음 */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full active:bg-[var(--color-grey-100)]"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-6 w-6 text-[var(--color-grey-700)]" />
        </button>

        {/* 중앙 제목: flex justify-center로 화면 정중앙 배치 */}
        <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">
          내 포인트
        </h1>

        {/* 오른쪽 포인트 칩: absolute로 띄움 */}
        <div className="absolute right-0 flex items-center gap-1.5 px-3 py-1 bg-[var(--color-green)] rounded-full shadow-sm">
          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">$</span>
          </div>
          <span className="caption1 font-bold text-white">6430P</span>
        </div>
      </header>

      {/* --- 상단 요약 카드 섹션 --- */}
      <div className="mt-8 rounded-2xl p-6 bg-[var(--color-light-green)]/20 mb-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="label2 text-[var(--color-grey-600)]">총 절감 탄소 배출량</span>
            <span className="title1 text-[var(--color-grey-900)]">5.4 <span className="body2">kgCO₂</span></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="label2 text-[var(--color-grey-600)]">환산 금액</span>
            <span className="title1 text-[var(--color-grey-900)]">2000 <span className="body2">원</span></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="label2 text-[var(--color-grey-600)]">보너스 포인트</span>
            <span className="title1 text-[var(--color-grey-900)]">10 <span className="body2">P</span></span>
          </div>
        </div>
      </div>

      <p className="text-center caption2 text-[var(--color-grey-400)] leading-relaxed mb-10 px-6">
        최근 3개월 평균 대비 배출량이 6.2% 감소하여<br />
        보너스 포인트가 지급되었습니다.
      </p>

      {/* --- 미션 리스트 섹션 --- */}
      <div className="mb-4">
        <h2 className="title1 text-[var(--color-grey-900)] mb-1">미션</h2>
        <p className="caption2 text-[var(--color-grey-400)]">다양한 미션을 수행하고 포인트를 모아보세요</p>
      </div>

      {/* 필터 칩 */}
      <div className="flex gap-2 mb-6">
        {["전체", "미션 전", "미션 완료"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-4 py-1.5 rounded-full border transition-all label2",
              filter === f 
                ? "bg-[var(--color-green)] border-transparent text-white" 
                : "bg-white border-[var(--color-grey-200)] text-[var(--color-grey-500)]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 미션 카드 리스트 */}
      <div className="space-y-3">
        <MissionCard title="대중교통 이용 확대" description="주 3일 대중교통 이용" points="20" reduction="-4.5kgCO₂" difficulty="중" />
        <MissionCard title="대중교통 이용 확대" description="주 3일 대중교통 이용" points="20" reduction="-4.5kgCO₂" difficulty="중" />
        <MissionCard title="대중교통 이용 확대" description="주 3일 대중교통 이용" points="20" reduction="-4.5kgCO₂" difficulty="중" isCompleted />
      </div>
    </div>
  );
}

// 개별 미션 카드 컴포넌트
function MissionCard({ title, description, points, reduction, difficulty, isCompleted }: any) {
  return (
    <div className={cn(
      "rounded-2xl p-5 border transition-all",
      isCompleted ? "bg-[var(--color-grey-100)] border-transparent" : "bg-white border-[var(--color-grey-200)] shadow-sm"
    )}>
      <div className="flex justify-between items-start mb-1">
        <h3 className="label1 text-[var(--color-grey-900)] font-bold">{title}</h3>
        <span className={cn(
          "label1 font-bold",
          isCompleted ? "text-[var(--color-grey-400)]" : "text-[var(--color-green)]"
        )}>
          {isCompleted ? "미션 완료" : `+ ${points} P`}
        </span>
      </div>
      <p className="body2 text-[var(--color-grey-500)] mb-3">{description}</p>
      <div className="flex justify-between items-end">
        <span className="title2 text-[var(--color-green)] opacity-80">{reduction}</span>
        <span className="caption2 text-[var(--color-grey-400)]">난이도 {difficulty}</span>
      </div>
    </div>
  );
}