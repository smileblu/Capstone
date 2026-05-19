import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTodayRecordStore } from "./store/RecordStore";
import ElectricityBillModal from "./ElectricityBillModal";
import { saveElectricity, getTodaySummary } from "../../api/inputService";
import type { ElectricityRequest } from "../../types/activity";

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

  // 이번 달 전기요금
  const [monthlyBill, setMonthlyBill] = useState<number>(0);
  const [pattern, setPattern] = useState<PatternKey>("home");
  /* const [householdCount, setHouseholdCount] = useState<number>(1); **/
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 오늘 이미 입력된 전기 데이터 */
  const [todayData, setTodayData] = useState<{
    kwh?: number;
    emissionKg: number;
  } | null>(null);

  useEffect(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const lastCheckedMonth = localStorage.getItem("last_bill_check_month");

    getTodaySummary()
      .then((summary) => {
        if (
          summary.electricity.hasData &&
          !summary.electricityFromOnboardingDefault
        ) {
          setTodayData({
            kwh: summary.electricity.kwh,
            emissionKg: summary.electricity.emissionKg,
          });
        } else if (lastCheckedMonth !== currentMonthKey) {
          setIsModalOpen(true);
        }
      })
      .catch(() => {
        if (lastCheckedMonth !== currentMonthKey) {
          setIsModalOpen(true);
        }
      });
  }, []);

  const handleBillSave = (newBill: number /*, people: number*/) => {
    setMonthlyBill(newBill);
    /* setHouseholdCount(people); */

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    localStorage.setItem("last_bill_check_month", currentMonthKey);

    setIsModalOpen(false); // 모달 닫기
  };

  /* const patternLabel = useMemo(() => {
    if (pattern === "home") return "재택이 많았어요";
    if (pattern === "out") return "외출이 많았어요";
    return "냉·난방을 사용했어요";
  }, [pattern]); */

  const canSave = useMemo(
    () => monthlyBill > 0 && Boolean(pattern) && !isSubmitting,
    [monthlyBill, pattern, isSubmitting],
  );

  const onSave = async () => {
    if (!canSave) return;

    try {
      setIsSubmitting(true);

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const activityDate = new Date().toISOString().split("T")[0];
      const periodStart = new Date(year, month, 1).toISOString().split("T")[0];
      const periodEnd = new Date(year, month + 1, 0)
        .toISOString()
        .split("T")[0];

      const payload: ElectricityRequest = {
        activityDate,
        billAmount: monthlyBill,
        usagePattern: pattern.toUpperCase() as "HOME" | "OUT" | "HVAC",
        periodStart,
        periodEnd,
      };

      await saveElectricity(payload);
      setElectricity({ kwh: 0, co2Kg: 0, moneyWon: 0 });
      navigate("/personal/input/summary");
    } catch (error: any) {
      console.error("전기 데이터 저장 실패:", error);
      // 400 에러 및 인터셉터에서 넘겨준 에러 메시지 처리
      alert(error?.message || "데이터 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = todayData !== null;

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

      {/* 오늘 이미 입력된 경우 배너 */}
      {isReadOnly && (
        <div className="mt-4 rounded-[12px] bg-[var(--color-green)]/10 border border-[var(--color-green)]/30 px-4 py-3">
          <div className="label2 text-[var(--color-green)]">
            오늘 이미 입력되었어요
          </div>
          <div className="mt-1 caption2 text-[var(--color-grey-550)]">
            {todayData?.kwh != null ? `${todayData.kwh.toFixed(1)} kWh` : ""}
            {todayData?.kwh != null && " · "}
            탄소 {todayData?.emissionKg.toFixed(2)} kgCO₂
          </div>
        </div>
      )}

      {/* 이번 달 전기요금 카드 */}
      <button
        type="button"
        onClick={() => !isReadOnly && setIsModalOpen(true)}
        className={cn(
          "mt-6 w-full h-14 rounded-[12px] px-4 flex items-center justify-between bg-[var(--color-grey-150)]",
          isReadOnly
            ? "pointer-events-none opacity-40 cursor-not-allowed"
            : "transition-colors hover:bg-[var(--color-grey-250)]",
        )}
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

      <div
        className={cn(
          "mt-[10px] grid gap-3",
          isReadOnly && "pointer-events-none opacity-40 cursor-not-allowed",
        )}
      >
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

      {/* 저장하기 */}
      <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
        <button
          type="button"
          disabled={!canSave || isReadOnly}
          onClick={onSave}
          className={cn(
            "h-14 w-full rounded-2xl bg-[var(--color-green)] label1 text-white",
            (!canSave || isReadOnly) && "opacity-50",
          )}
          style={{ backgroundColor: "var(--color-green)" }}
        >
          저장하기
        </button>
      </div>

      <div className="h-28" />

      <ElectricityBillModal
        isOpen={isModalOpen}
        currentBill={monthlyBill}
        onSave={handleBillSave}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
