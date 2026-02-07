import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTodayRecordStore } from "./store/RecordStore";

type PatternKey = "home" | "out" | "hvac";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-9 title1 text-[var(--color-black)]">{children}</h2>;
}
function SelectRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full h-12 rounded-[8px] border transition flex items-center justify-center label2",
        selected
          ? "border-transparent text-white"
          : "border-[var(--color-grey-250)] text-[var(--color-grey-950)] bg-white hover:bg-[var(--color-grey-50)]",
      )}
      style={{ backgroundColor: selected ? "var(--color-green)" : undefined }}
    >
      {label}
    </button>
  );
}

export default function ElectricityInputPage() {
  const navigate = useNavigate();

  const setElectricity = useTodayRecordStore((s) => s.setElectricity);

  // 이번 달 전기요금(원)
  const [monthlyBill, setMonthlyBill] = useState<number>(32000);

  // 생활 패턴: 단일 선택
  const [pattern, setPattern] = useState<PatternKey>("home");

  const patternLabel = useMemo(() => {
    if (pattern === "home") return "재택이 많았어요";
    if (pattern === "out") return "외출이 많았어요";
    return "냉·난방을 사용했어요";
  }, [pattern]);

  const canSave = useMemo(
    () => monthlyBill > 0 && Boolean(pattern),
    [monthlyBill, pattern],
  );

  const onBillSetting = () => {
    // 나중에 "요금 설정" 모달/페이지 연결 (지금은 임의 2개로 누르면 바뀜)
    const next = monthlyBill === 32000 ? 45000 : 32000;
    setMonthlyBill(next);
  };

  const onSave = () => {
    const payload = { monthlyBill, pattern };
    console.log("electricity input:", payload);

    // 나중에 실제 계산 로직으로 바꾸기
    const electricitySummary = {
      kwh: 4.1,
      co2Kg: 1.2,
      moneyWon: 480,
    };

    setElectricity(electricitySummary);
    navigate("/input/summary");
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
              strokeWidth={2}
              color="var(--color-grey-750)"
            />
          </button>

          <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">
            전기 입력
          </h1>
        </div>

        <p className="mt-2 text-center body2 text-[var(--color-grey-550)]">
          오늘 전기 사용을 기록해주세요
        </p>
      </div>

      {/* 이번 달 전기요금 카드 */}
      <button
        type="button"
        onClick={onBillSetting}
        className="mt-6 w-full h-14 rounded-[12px] px-4 flex items-center justify-between bg-[var(--color-grey-150)] transition-colors hover:bg-[var(--color-grey-250)]"
      >
        <div className="caption1 font-medium text-[var(--color-grey-950)]">
          이번 달 전기요금
        </div>

        <div className="title1 text-[var(--color-green)]">
          {monthlyBill.toLocaleString()}
          <span className="label2 text-[var(--color-grey-950)] ml-1">원</span>
        </div>

        <div className="caption1 font-medium text-[var(--color-green)] underline underline-offset-2">
          요금 설정 →
        </div>
      </button>

      {/* 오늘의 생활 패턴 */}
      <SectionTitle>오늘의 생활 패턴</SectionTitle>

      <div className="mt-[10px] grid gap-3">
        <SelectRow
          label="재택이 많았어요"
          selected={pattern === "home"}
          onClick={() => setPattern("home")}
        />
        <SelectRow
          label="외출이 많았어요"
          selected={pattern === "out"}
          onClick={() => setPattern("out")}
        />
        <SelectRow
          label="냉·난방을 사용했어요"
          selected={pattern === "hvac"}
          onClick={() => setPattern("hvac")}
        />
      </div>

      <p className="mt-3 text-right caption2 text-[var(--color-grey-550)]">
        * 생활 패턴에 따라 하루 전기 사용량이 조정돼요
      </p>

      {/* 아래 설명 텍스트 */}
      <div className="mt-8 text-center body2 leading-relaxed text-[var(--color-green)]">
        전기 사용량은 이번 달 전기요금을 기준으로
        <br />일 평균 사용량을 계산해 반영해요
      </div>

      {/* 저장하기 버튼 */}
      <div className="pt-26">
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
