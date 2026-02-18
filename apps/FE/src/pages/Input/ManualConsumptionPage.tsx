import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTodayRecordStore } from "./store/RecordStore";

type Category = "배달 음식" | "외식" | "카페·음료" | "의류·패션" | "기타";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: Category;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl border label2 transition flex items-center justify-center",
        selected
          ? "border-transparent text-white"
          : "border-[var(--color-grey-250)] text-[var(--color-grey-750)] bg-white hover:bg-[var(--color-grey-50)]",
      )}
      style={{
        backgroundColor: selected
          ? "var(--color-light-green)"
          : "var(--color-white)",
      }}
    >
      {label}
    </button>
  );
}

function StepButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center border",
        "title1 transition",
        disabled
          ? "opacity-30"
          : "hover:bg-[var(--color-grey-150)] active:scale-[0.95]",
      )}
      style={{
        borderColor: "var(--color-grey-250)",
        backgroundColor: "var(--color-grey-50)",
        color: "var(--color-grey-950)",
      }}
      aria-label={typeof children === "string" ? children : undefined}
    >
      {children}
    </button>
  );
}

export default function ConsumptionManualPage() {
  const navigate = useNavigate();

  const setConsumption = useTodayRecordStore((s) => s.setConsumption);

  const categories: Category[] = [
    "배달 음식",
    "외식",
    "카페·음료",
    "의류·패션",
    "기타",
  ];

  const [category, setCategory] = useState<Category>("배달 음식");
  const [count, setCount] = useState<number>(1);

  const canSave = useMemo(
    () => count > 0 && Boolean(category),
    [count, category],
  );

  const onSave = () => {
    const payload = { category, count };
    console.log("consumption manual input:", payload);

    // TODO: (카테고리, 횟수) 기반 계산 로직으로 바꾸기
    const consumptionSummary = {
      co2Kg: 0.9,
      moneyWon: 360,
    };

    setConsumption(consumptionSummary);
    navigate("/personal/input/summary");
  };
  return (
    <>
      {/* 페이지 타이틀 */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 h-10 w-10 rounded-full hover:bg-[var(--color-grey-150)] flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <ArrowLeft
              size={24}
              strokeWidth={1.5}
              color="var(--color-grey-750)"
            />
          </button>
          <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">
            직접 입력
          </h1>
        </div>

        <p className="mt-2 text-center body2 text-[var(--color-grey-550)]">
          소비 생활을 입력해주세요
        </p>
      </div>

      {/* 소비 유형 */}
      <h2 className="mt-8 title1 text-[var(--color-black)]">소비 유형</h2>
      <p className="mt-2 caption2 text-[var(--color-grey-550)]">
        소비 유형별 평균 탄소 배출량을 적용해요
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {(["배달 음식", "외식", "카페·음료"] as Category[]).map((c) => (
          <Chip
            key={c}
            label={c}
            selected={category === c}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {(["의류·패션", "기타"] as Category[]).map((c) => (
          <Chip
            key={c}
            label={c}
            selected={category === c}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      {/* 횟수 */}
      <h2 className="mt-8 title1 text-[var(--color-black)]">횟수</h2>

      <div className="mt-6 flex items-center justify-center gap-6">
        <StepButton
          onClick={() => setCount((v) => Math.max(1, v - 1))}
          disabled={count <= 1}
        >
          −
        </StepButton>

        <div className="min-w-[64px] text-center title1 text-[var(--color-grey-950)]">
          {count}회
        </div>

        <StepButton onClick={() => setCount((v) => v + 1)}>+</StepButton>
      </div>

      {/* 저장하기 버튼 */}
      <div className="pt-50">
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className={cn(
            "h-14 w-full rounded-2xl bg-[var(--color-green)] label1 text-white",
            !canSave && "opacity-50",
          )}
          style={{ backgroundColor: "var(--color-green)" }}
        >
          저장하기
        </button>
      </div>
    </>
  );
}
