import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import CompanyPageHeader from "../CompanyPageHeader";
import axiosInstance from "../../../api/axiosInstance";

type CardStatus = "idle" | "done" | "error" | "partial";

type InputCardItem = {
  title: string;
  subtitle: string;
  path: string;
  logType: string;
  status: CardStatus;
};

// 백엔드 inputItems name → 카드 title 매핑
const BACKEND_TO_CARD: Record<string, string> = {
  "전력": "전기",
  "고정 연소": "고정 연소",
  "이동 연소": "이동 연소",
  "공정 가스": "공정 가스",
  "폐기물": "폐기물",
  "용수": "용수",
};

const CARD_DEFS: Omit<InputCardItem, "status">[] = [
  { title: "전기",     logType: "BUSINESS_ELECTRICITY",            subtitle: "Scope 2: 전력 사용량 (kWh)",              path: "/company/input/electricity" },
  { title: "고정 연소", logType: "BUSINESS_STATIONARY_COMBUSTION", subtitle: "Scope 1: 연료 사용량 (L / Nm3 / kg)",      path: "/company/input/stationary-combustion" },
  { title: "이동 연소", logType: "BUSINESS_MOBILE_COMBUSTION",     subtitle: "Scope 1: 차량, 물류, 이동 거리 또는 연료 사용량",   path: "/company/input/mobile-combustion" },
  { title: "공정 가스", logType: "BUSINESS_PROCESS_GAS",           subtitle: "Scope 1: 공정 가스 사용량 (kg)",                    path: "/company/input/gas" },
  { title: "폐기물",   logType: "BUSINESS_WASTE",                  subtitle: "Scope 3: 처리량 (kg / ton / m3)",                   path: "/company/input/waste" },
  { title: "용수",     logType: "BUSINESS_WATER",                  subtitle: "Scope 3: 용수 사용량 및 폐수량 (ton / m3 / L)",     path: "/company/input/water" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getBillingPeriodLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function getInputWindowLabel() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return `${y}.${m}.01 - ${y}.${m}.${String(lastDay).padStart(2, "0")}`;
}

export default function BusinessInputPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cards, setCards] = useState<InputCardItem[]>(
    CARD_DEFS.map((c) => ({ ...c, status: "idle" as CardStatus }))
  );

  // 대시보드에서 완료된 항목 조회
  useEffect(() => {
    axiosInstance
      .get<any, { inputItems: { name: string; done: boolean }[] }>("/company/dashboard/summary")
      .then((res) => {
        const doneSet = new Set<string>();
        (res.inputItems ?? []).forEach(({ name, done }) => {
          if (done) doneSet.add(BACKEND_TO_CARD[name] ?? name);
        });
        setCards((prev) =>
          prev.map((c) => ({
            ...c,
            status: c.status === "idle" && doneSet.has(c.title) ? "done" : c.status,
          }))
        );
      })
      .catch(() => {});
  }, []);

  // InputFormPage에서 navigate 시 전달된 업로드 오류 상태 반영
  useEffect(() => {
    const state = location.state as {
      errorLogType?: string;
      savedCount?: number;
      errorCount?: number;
    } | null;

    if (!state?.errorLogType || !state.errorCount) return;

    setCards((prev) =>
      prev.map((c) => {
        if (c.logType !== state.errorLogType) return c;
        const newStatus: CardStatus =
          (state.savedCount ?? 0) === 0 ? "error" : "partial";
        return { ...c, status: newStatus };
      })
    );
    // 상태 소비 후 히스토리 초기화 (뒤로가기 시 반복 반영 방지)
    window.history.replaceState({}, "");
  }, [location.state]);

  return (
    <div className="grid gap-3 pb-28">
      <section className="text-center">
        <CompanyPageHeader title="탄소 데이터 입력" />
        <p className="mt-2 body2 text-[var(--color-grey-550)]">
          이번 달 배출 데이터를 항목별로 입력해주세요.
        </p>
      </section>

      <section className="mt-3 rounded-xl bg-[var(--color-grey-250)] px-5 py-3">
        <p className="body2 text-[var(--color-grey-650)]">
          입력 대상 기간: {getBillingPeriodLabel()}
        </p>
        <p className="mt-1 body2 text-[var(--color-grey-650)]">
          입력 가능 기간: {getInputWindowLabel()}
        </p>
      </section>

      <div className="grid gap-3 pt-2">
        {cards.map((item) => (
          <InputCard
            key={item.path}
            title={item.title}
            subtitle={item.subtitle}
            status={item.status}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

      <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
        <button
          type="button"
          className="h-14 w-full rounded-xl bg-[var(--color-green)] label1 text-white shadow-lg transition-all active:scale-[0.98] hover:brightness-95"
          onClick={() => navigate("/company/analyzation")}
        >
          이번 달 입력 완료하기
        </button>
      </div>
    </div>
  );
}

function InputCard({
  title, subtitle, status, onClick,
}: {
  title: string; subtitle: string; status: CardStatus; onClick: () => void;
}) {
  const isDone    = status === "done";
  const isError   = status === "error";
  const isPartial = status === "partial";

  return (
    <button
      type="button"
      onClick={onClick}   // 모든 상태에서 클릭 가능 (재진입 허용)
      className={cn(
        "w-full rounded-xl border px-6 py-4 text-left transition-all active:scale-[0.99]",
        isDone    && "border-[var(--color-grey-250)] bg-[var(--color-grey-150)]",
        isError   && "border-2 border-red-400 bg-red-50",
        isPartial && "border-2 border-orange-400 bg-orange-50",
        !isDone && !isError && !isPartial && "border-[var(--color-grey-250)] bg-white",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="title1 text-[var(--color-black)]">{title}</div>
          <div className="mt-2 body2 text-[var(--color-grey-550)]">{subtitle}</div>
        </div>
        <div className="shrink-0">
          {isDone    && <CheckCircle  className="h-6 w-6 text-[var(--color-green)]" />}
          {isError   && (
            <div className="flex flex-col items-center gap-0.5">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <span className="caption2 text-red-500 font-bold leading-none">실패</span>
            </div>
          )}
          {isPartial && (
            <div className="flex flex-col items-center gap-0.5">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <span className="caption2 text-orange-500 font-bold leading-none">일부 오류</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
