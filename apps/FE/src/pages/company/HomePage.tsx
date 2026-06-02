import { useEffect, useState } from "react";
import { CheckCircle, Circle } from "lucide-react";
import cocoLogo from "../../assets/coco_logo.png";
import CompanyPageHeader from "./CompanyPageHeader";
import axiosInstance from "../../api/axiosInstance";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type EmissionSource = { name: string; percent: number };
type InputItem = { name: string; done: boolean };

type DashboardData = {
  totalEmission: number;   // tCO₂e
  monthlyChange: number | null;
  emissionSources: EmissionSource[];
  inputItems: InputItem[];
};

const PIE_COLORS = ["#617B3B", "#8DA75F", "#B8CD7A"];
const DEFAULT_INPUT_ITEMS: InputItem[] = [
  { name: "전력", done: false },
  { name: "고정 연소", done: false },
  { name: "폐기물", done: false },
  { name: "이동 연소", done: false },
  { name: "공정 가스", done: false },
  { name: "용수", done: false },
];

// K-ETS 가격 (원/tCO₂e) — BE에서 내려오지 않을 때 fallback
const K_ETS_WON_PER_TON = 12_000;

function InputStatusItem({ item }: { item: InputItem }) {
  return (
    <div className="flex items-center gap-2 caption1 text-[var(--color-black)]">
      {item.done ? (
        <CheckCircle size={18} className="shrink-0 text-[var(--color-green)]" />
      ) : (
        <Circle size={18} className="shrink-0 text-[var(--color-grey-350)]" />
      )}
      <span className="whitespace-nowrap leading-tight">{item.name}</span>
    </div>
  );
}

export default function BusinessHomePage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    axiosInstance.get<unknown, DashboardData>("/company/dashboard/summary")
      .then(setData)
      .catch(() => {});
  }, []);

  const totalEmission   = data?.totalEmission  ?? 0;
  const monthlyChange   = data?.monthlyChange  ?? null;
  const emissionSources = data?.emissionSources ?? [];
  const inputItems      = data?.inputItems?.length ? data.inputItems : DEFAULT_INPUT_ITEMS;

  // 금전 환산: tCO₂e × K-ETS 가격
  const carbonCostKrw = Math.round(totalEmission * K_ETS_WON_PER_TON);

  const completedCount   = inputItems.filter((i) => i.done).length;
  const totalCount       = inputItems.length;
  const progressPercent  = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isIncrease       = monthlyChange !== null && monthlyChange > 0;

  // 파이 차트용 conic-gradient 생성
  const pieGradient = (() => {
    if (emissionSources.length === 0) return "conic-gradient(#E0E0E0 0 100%)";
    const parts: string[] = [];
    let cumulative = 0;
    emissionSources.forEach((s, i) => {
      const color = PIE_COLORS[i] ?? "#ccc";
      parts.push(`${color} ${cumulative}% ${cumulative + s.percent}%`);
      cumulative += s.percent;
    });
    if (cumulative < 100) parts.push(`#E0E0E0 ${cumulative}% 100%`);
    return `conic-gradient(${parts.join(", ")})`;
  })();

  return (
    <div className="pb-24">
      <CompanyPageHeader title="COCO" imageSrc={cocoLogo} imageAlt="COCO" />

      <section className="mt-5">
        <div className="flex items-center gap-2">
          <h2 className="title1 text-[var(--color-black)]">이번 달 요약</h2>
        </div>

        <div className="mt-3 rounded-2xl bg-[#E6EEDB] px-11 py-4">
          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3">
            {/* 총 탄소배출량 */}
            <p className="label2 text-[var(--color-black)]">총 탄소 배출량</p>
            <p className="label1 text-right text-[var(--color-black)]">
              {totalEmission.toFixed(2)}
              <span className="ml-1 body2">tCO₂e</span>
            </p>

            {/* 금전 환산 카드 */}
            <p className="label2 text-[var(--color-black)]">금전 환산</p>
            <p className="label1 text-right text-[var(--color-dark-green)]">
              약 {carbonCostKrw.toLocaleString("ko-KR")}
              <span className="ml-1 body2">원/월</span>
            </p>

            {/* 전월 대비 */}
            <p className="label2 text-[var(--color-black)]">전월 대비</p>
            <p className={cn("label1 text-right", isIncrease ? "text-red-600" : "text-[var(--color-dark-green)]")}>
              {monthlyChange === null
                ? "-"
                : `${isIncrease ? "+" : ""}${monthlyChange.toFixed(1)} %`}
            </p>
          </div>

          <p className="mt-2 caption2 text-[var(--color-grey-650)] text-right">
            K-ETS 기준 {K_ETS_WON_PER_TON.toLocaleString("ko-KR")}원/tCO₂e
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="title1 text-[var(--color-black)]">배출 구조</h2>

        <div className="mt-3 rounded-none border border-[var(--color-grey-250)] bg-white px-5 py-4">
          {emissionSources.length === 0 ? (
            <p className="text-center body2 text-[var(--color-grey-450)] py-8">
              이번 달 입력된 배출 데이터가 없습니다.
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-center gap-8">
                <div
                  className="h-32 w-32 rounded-full"
                  style={{ background: pieGradient }}
                />
                <div className="grid gap-2">
                  {emissionSources.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 caption2 text-[var(--color-grey-750)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index] ?? "#ccc" }} />
                      {item.name} {item.percent}%
                    </div>
                  ))}
                </div>
              </div>
              {emissionSources[0] && (
                <p className="mt-6 text-center caption2 text-[var(--color-grey-650)]">
                  {emissionSources[0].name}이(가) 전체의 {emissionSources[0].percent}%로 가장 많아요
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <section className="mt-11">
        <h2 className="title1 text-[var(--color-black)]">입력 현황</h2>

        <div className="mt-3 rounded-2xl border border-[var(--color-grey-250)] bg-white px-12 py-5">
          <p className="text-center caption1 text-[var(--color-grey-650)]">
            총 {totalCount}개 항목 중 {completedCount}개 완료
          </p>

          <div className="mt-5 h-2 rounded-full bg-[var(--color-grey-250)]">
            <div className="h-2 rounded-full bg-[var(--color-green)]" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="relative mt-7 grid grid-cols-2 gap-x-6">
            <div className="absolute left-1/2 top-1 bottom-1 w-px -translate-x-1/2 bg-[var(--color-grey-150)]" />
            <div className="grid gap-3">
              {inputItems.slice(0, 3).map((item) => (
                <InputStatusItem key={item.name} item={item} />
              ))}
            </div>
            <div className="grid gap-3 pl-6">
              {inputItems.slice(3, 6).map((item) => (
                <InputStatusItem key={item.name} item={item} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
