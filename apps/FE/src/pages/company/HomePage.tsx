import { ChevronDown, CheckCircle, Circle } from "lucide-react";
import CompanyPageHeader from "./CompanyPageHeader";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function InputStatusItem({ item }: { item: { name: string; done: boolean } }) {
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
  const totalEmission = 23.4;
  const monthlyChange = -8; // +8로 바꾸면 빨간색 증가 표시
  const completedCount = 3;
  const totalCount = 6;
  const progressPercent = (completedCount / totalCount) * 100;

  const emissionSources = [
    { name: "전력", percent: 42 },
    { name: "운송", percent: 33 },
    { name: "연료", percent: 25 },
  ];

  const inputItems = [
    { name: "전력", done: true },
    { name: "고정 연소", done: false },
    { name: "폐기물", done: true },
    { name: "이동 연소", done: true },
    { name: "공정 가스 배출", done: false },
    { name: "온수, 스팀", done: false },
  ];

  const isIncrease = monthlyChange > 0;

  return (
    <div className="pb-24">
      {/* 타이틀 */}
      <CompanyPageHeader title="COCO" />

      {/* 이번 달 요약 */}
      <section className="mt-9">
        <button
          type="button"
          className="flex items-center gap-1 title1 text-[var(--color-black)]"
        >
          이번 달 요약
          <ChevronDown size={16} className="text-[var(--color-grey-550)]" />
        </button>

        <div className="mt-2 rounded-xl bg-[#E6EEDB] px-12 py-4">
          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1">
            <p className="label2 text-[var(--color-black)]">총 탄소 배출량</p>
            <p className="label1 text-[var(--color-black)]">
              {totalEmission.toFixed(1)}
              <span className="ml-1 body2">kgCO₂</span>
            </p>

            <p className="label2 text-[var(--color-black)]">전월 대비</p>
            <p
              className={cn(
                "label1 text-right",
                isIncrease ? "text-red-600" : "text-[var(--color-dark-green)]",
              )}
            >
              {isIncrease ? "+" : ""}
              {monthlyChange} %
            </p>
          </div>
        </div>
      </section>

      {/* 배출 구조 */}
      <section className="mt-12">
        <h2 className="title1 text-[var(--color-black)]">배출 구조</h2>

        <div className="mt-3 rounded-none border border-[var(--color-grey-250)] bg-white px-5 py-4">
          <p className="text-center body2 text-[var(--color-grey-550)]">
            Top 3 배출원 그래프
          </p>

          <div className="mt-8 flex items-center justify-center gap-8">
            <div className="h-32 w-32 rounded-full bg-[conic-gradient(#617B3B_0_42%,#8DA75F_42%_75%,#B8CD7A_75%_100%)]" />

            <div className="grid gap-2">
              {emissionSources.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 caption2 text-[var(--color-grey-750)]"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      index === 0 && "bg-[#617B3B]",
                      index === 1 && "bg-[#8DA75F]",
                      index === 2 && "bg-[#B8CD7A]",
                    )}
                  />
                  {item.name} {item.percent}%
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center caption2 text-[var(--color-grey-650)]">
            전력이 전체의 42%로 가장 많아요
          </p>
        </div>
      </section>

      {/* 입력 현황 */}
      <section className="mt-11">
        <h2 className="title1 text-[var(--color-black)]">입력 현황</h2>

        <div className="mt-3 rounded-2xl border border-[var(--color-grey-250)] bg-white px-12 py-5">
          <p className="text-center caption1 text-[var(--color-grey-650)]">
            총 {totalCount}개 항목 중 {completedCount}개 완료
          </p>

          <div className="mt-5 h-2 rounded-full bg-[var(--color-grey-250)]">
            <div
              className="h-2 rounded-full bg-[var(--color-green)]"
              style={{ width: `${progressPercent}%` }}
            />
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
