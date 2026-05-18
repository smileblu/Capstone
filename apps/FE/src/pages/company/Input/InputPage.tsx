import { AlertCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CompanyPageHeader from "../CompanyPageHeader";

type InputStatus = "completed" | "warning" | "danger";

type InputCardItem = {
  title: string;
  subtitle: string;
  path: string;
  status?: InputStatus;
};

const INPUT_CARDS: InputCardItem[] = [
  {
    title: "전기",
    subtitle: "Scope 2: 전력 사용량 (kWh)",
    path: "/company/input/electricity",
  },
  {
    title: "고정 연소",
    subtitle: "Scope 1: 연료 사용량 (L / Nm3 / kg)",
    path: "/company/input/stationary-combustion",
  },
  {
    title: "이동 연소",
    subtitle: "차량, 물류, 이동 거리 또는 연료 사용량",
    path: "/company/input/mobile-combustion",
    status: "warning",
  },
  {
    title: "공정 가스",
    subtitle: "공정 가스 사용량 (kg)",
    path: "/company/input/gas",
    status: "danger",
  },
  {
    title: "폐기물",
    subtitle: "처리량 (kg / ton / m3)",
    path: "/company/input/waste",
  },
  {
    title: "용수",
    subtitle: "용수 사용량 및 폐수량 (ton / m3 / L)",
    path: "/company/input/water",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BusinessInputPage() {
  const navigate = useNavigate();

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
          입력 대상 기간: 2026년 3월
        </p>
        <p className="mt-1 body2 text-[var(--color-grey-650)]">
          입력 가능 기간: 2026.04.01 - 2026.04.10
        </p>
      </section>

      <div className="grid gap-3 pt-2">
        {INPUT_CARDS.map((item) => (
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
  title,
  subtitle,
  onClick,
  status,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
  status?: InputStatus;
}) {
  const isCompleted = status === "completed";
  const isWarning = status === "warning";
  const isDanger = status === "danger";

  return (
    <button
      type="button"
      disabled={isCompleted}
      onClick={!isCompleted ? onClick : undefined}
      className={cn(
        "w-full rounded-xl border px-6 py-4 text-left transition-all active:scale-[0.99]",
        isCompleted &&
          "cursor-default border-transparent bg-[var(--color-grey-250)]",
        !isCompleted &&
          !isWarning &&
          !isDanger &&
          "border-[var(--color-grey-250)] bg-white",
        isWarning && "border-2 border-red-500 bg-white",
        isDanger && "border-transparent bg-[#F6E1DE]",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="title1 text-[var(--color-black)]">{title}</div>
          <div className="mt-2 body2 text-[var(--color-grey-550)]">
            {subtitle}
          </div>
        </div>

        {isWarning && (
          <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--color-dark-green)]" />
        )}
        {isDanger && (
          <AlertCircle className="h-6 w-6 shrink-0 text-red-700" />
        )}
      </div>
    </button>
  );
}
