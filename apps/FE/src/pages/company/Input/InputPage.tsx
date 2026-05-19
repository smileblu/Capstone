import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CompanyPageHeader from "../CompanyPageHeader";
import axiosInstance from "../../../api/axiosInstance";

// 백엔드 name(전력) → FE 카드 title(전기) 매핑
const BACKEND_TO_CARD: Record<string, string> = {
  "전력": "전기",
  "고정 연소": "고정 연소",
  "이동 연소": "이동 연소",
  "공정 가스": "공정 가스",
  "폐기물": "폐기물",
  "용수": "용수",
};

type InputCardItem = {
  title: string;
  subtitle: string;
  path: string;
  done: boolean;
};

const CARD_DEFS: Omit<InputCardItem, "done">[] = [
  { title: "전기",    subtitle: "Scope 2: 전력 사용량 (kWh)",              path: "/company/input/electricity" },
  { title: "고정 연소", subtitle: "Scope 1: 연료 사용량 (L / Nm3 / kg)",  path: "/company/input/stationary-combustion" },
  { title: "이동 연소", subtitle: "차량, 물류, 이동 거리 또는 연료 사용량", path: "/company/input/mobile-combustion" },
  { title: "공정 가스", subtitle: "공정 가스 사용량 (kg)",                  path: "/company/input/gas" },
  { title: "폐기물",  subtitle: "처리량 (kg / ton / m3)",                   path: "/company/input/waste" },
  { title: "용수",    subtitle: "용수 사용량 및 폐수량 (ton / m3 / L)",     path: "/company/input/water" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** 입력 대상 기간: 이전 달 (YYYY년 M월) */
function getBillingPeriodLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

/** 입력 가능 기간: 당월 1~10일 */
function getInputWindowLabel() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}.${m}.01 - ${y}.${m}.10`;
}

export default function BusinessInputPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<InputCardItem[]>(
    CARD_DEFS.map((c) => ({ ...c, done: false }))
  );

  useEffect(() => {
    axiosInstance
      .get<any, { inputItems: { name: string; done: boolean }[] }>("/company/dashboard/summary")
      .then((res) => {
        const doneSet = new Set<string>();
        (res.inputItems ?? []).forEach(({ name, done }) => {
          if (done) doneSet.add(BACKEND_TO_CARD[name] ?? name);
        });
        setCards(CARD_DEFS.map((c) => ({ ...c, done: doneSet.has(c.title) })));
      })
      .catch(() => {});
  }, []);

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
            done={item.done}
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
  title, subtitle, done, onClick,
}: {
  title: string; subtitle: string; done: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={done ? undefined : onClick}
      disabled={done}
      className={cn(
        "w-full rounded-xl border px-6 py-4 text-left transition-all active:scale-[0.99]",
        done
          ? "cursor-default border-transparent bg-[var(--color-grey-250)]"
          : "border-[var(--color-grey-250)] bg-white",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="title1 text-[var(--color-black)]">{title}</div>
          <div className="mt-2 body2 text-[var(--color-grey-550)]">{subtitle}</div>
        </div>
        {done && <AlertCircle className="h-6 w-6 shrink-0 text-[var(--color-green)]" />}
      </div>
    </button>
  );
}
