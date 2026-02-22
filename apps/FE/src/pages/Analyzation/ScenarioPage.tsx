import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";

type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  impactText: string; // "- 4.5kgCO₂ | 650원 절약"
  difficulty: "하" | "중" | "상";
};

const scenarios: Scenario[] = [
  {
    id: "s1",
    title: "대중교통 이용 확대",
    subtitle: "주 3일 대중교통 이용",
    impactText: "- 4.5kgCO₂ | 650원 절약",
    difficulty: "중",
  },
  {
    id: "s2",
    title: "친환경 이동수단 전환",
    subtitle: "자전거/도보 이동 늘리기",
    impactText: "- 2.1kgCO₂ | 0원",
    difficulty: "하",
  },
  {
    id: "s3",
    title: "전력 사용 줄이기",
    subtitle: "대기전력 차단 + 절전모드",
    impactText: "- 1.3kgCO₂ | 900원 절약",
    difficulty: "하",
  },
  {
    id: "s4",
    title: "배달 줄이기",
    subtitle: "주 2회 배달 대신 직접 조리",
    impactText: "- 3.0kgCO₂ | 3,000원 절약",
    difficulty: "상",
  },
];

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function ScenarioCard({
  item,
  selected,
  onToggle,
}: {
  item: Scenario;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "w-full rounded-[12px] border px-5 py-[15px] text-left transition-all active:scale-[0.99]",
        selected
          ? "border-[var(--color-green)] bg-[rgba(124,170,72,0.08)]"
          : "border-[var(--color-grey-250)] bg-white",
      )}
    >
      <div className="flex flex-col items-start">
        {/* Title row */}
        <div className="flex w-full items-center justify-between">
          <div className="label1 text-[var(--color-black)]">{item.title}</div>

          {/* 선택 토글 버튼 (카드 클릭과 동일 동작) */}
          <button
            type="button"
            aria-label="선택"
            onClick={(e) => {
              e.stopPropagation(); // ✅ 카드 클릭 이벤트 중복 방지
              onToggle();
            }}
            className={cx(
              "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
              selected
                ? "border-[var(--color-green)] bg-[var(--color-green)]"
                : "border-[var(--color-grey-350)] bg-white",
            )}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-white" />}
          </button>
        </div>

        <div className="body1 text-[var(--color-grey-550)]">
          {item.subtitle}
        </div>

        <div className="mt-1 flex w-full justify-between">
          <div className="body1 text-[var(--color-green)]">
            {item.impactText}
          </div>
          <div className="body2 text-[var(--color-grey-350)]">
            난이도 {item.difficulty}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ScenarioPage() {
  const navigate = useNavigate();

  // ✅ 여러 개 선택: Set으로 관리 (빠르고 깔끔)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;

  // 선택된 시나리오 배열이 필요하면 (미션 페이지로 넘길 때)
  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const goBack = () => {
    return navigate(-1);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="h-6 w-6 text-[var(--color-grey-750)]" />
        </button>
        <div className="flex-1 text-center">
          <div className="h0 text-[var(--color-dark-green)]">
            탄소 절감 방법
          </div>
        </div>
        <div className="h-10 w-10" />
      </div>

      <main className="mt-6">
        <div className="title1 text-[var(--color-black)]">
          탄소 절감 시나리오
        </div>
        <div className="caption2 text-[var(--color-grey-550)]">
          개인 맞춤 우선 순위 순 (복수 선택 가능)
        </div>

        <div className="mt-3 space-y-3">
          {scenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              item={s}
              selected={selectedIds.has(s.id)}
              onToggle={() => toggleSelect(s.id)}
            />
          ))}
        </div>

        {/* CTA: Navbar 위에 고정 */}
        <div className="fixed left-1/2 bottom-[80px] z-40 w-[402px] -translate-x-1/2 px-5">
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => {
              console.log("선택한 시나리오:", selectedList);
              // TODO: 선택한 시나리오 ids를 가지고 미션 생성/이동
              // navigate(`/personal/mission?ids=${selectedList.join(",")}`);
            }}
            className={cx(
              "label1 h-12 w-full rounded-[8px] transition-all active:scale-[0.99]",
              selectedCount > 0
                ? "bg-[var(--color-green)] text-[var(--color-white)]"
                : "bg-[var(--color-grey-150)] text-[var(--color-grey-350)]",
            )}
          >
            {selectedCount > 0
              ? `미션하러 가기 (${selectedCount})`
              : "시나리오를 선택해주세요"}
          </button>
        </div>

        {/* 바닥 여백 (고정 버튼 + navbar 때문에) */}
        <div className="h-[120px]" />
      </main>
    </div>
  );
}
