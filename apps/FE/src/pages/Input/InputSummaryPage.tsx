import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTodayRecordStore } from "./store/RecordStore";

type SummaryBlock = {
  title: "교통" | "전기" | "음식·소비";
  rows: Array<{ label: string; value: string; unit: string }>;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* --- 포맷터 함수 --- */
function formatKgCO2(x: number) { return `${x.toFixed(1)} kgCO₂`; }
function formatWon(x: number) { return `${x.toLocaleString()} 원`; }
function formatKwh(x: number) { return `${x.toFixed(1)} kWh`; }

/* --- 공용 컴포넌트 --- */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-[var(--color-grey-250)] bg-white p-5">
      {children}
    </div>
  );
}

function SoftBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[12px] p-5 bg-[var(--color-light-green)]/10">
      {children}
    </div>
  );
}

function KeyValueRows({ rows }: { rows: Array<{ label: string; value: string; unit: string }> }) {
  return (
    <div className="grid gap-2">
      {rows.map((r, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="body2 text-[var(--color-grey-800)]">{r.label}</span>
          <div className="flex items-baseline gap-1">
            <span className="label1 text-[var(--color-grey-950)]">{r.value}</span>
            <span className="body2 text-[var(--color-grey-800)]">{r.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-9 title1 text-[var(--color-black)]">{children}</h2>;
}

/* --- 메인 페이지 --- */
export default function InputSummaryPage() {
  const navigate = useNavigate();

  const transport = useTodayRecordStore((s) => s.transport);
  const electricity = useTodayRecordStore((s) => s.electricity);
  const consumption = useTodayRecordStore((s) => s.consumption);

  const isEmpty = !transport && !electricity && !consumption;

  const blocks: SummaryBlock[] = useMemo(() => {
    const arr: SummaryBlock[] = [];

    if (transport) {
      arr.push({
        title: "교통",
        rows: [
          { label: "탄소 배출량", value: transport.co2Kg.toFixed(1), unit: "kgCO₂" },
          { label: "금전 환산", value: transport.moneyWon.toLocaleString(), unit: "원" },
        ],
      });
    }

    if (electricity) {
      arr.push({
        title: "전기",
        rows: [
          { label: "추정 전력 사용량", value: electricity.kwh.toFixed(1), unit: "kWh" },
          { label: "탄소 배출량", value: electricity.co2Kg.toFixed(1), unit: "kgCO₂" },
          { label: "금전 환산", value: electricity.moneyWon.toLocaleString(), unit: "원" },
        ],
      });
    }

    if (consumption) {
      arr.push({
        title: "음식·소비",
        rows: [
          { label: "탄소 배출량", value: consumption.co2Kg.toFixed(1), unit: "kgCO₂" },
          { label: "금전 환산", value: consumption.moneyWon.toLocaleString(), unit: "원" },
        ],
      });
    }

    return arr;
  }, [transport, electricity, consumption]);

  const total = useMemo(() => {
    const co2 =
      (transport?.co2Kg ?? 0) + (electricity?.co2Kg ?? 0) + (consumption?.co2Kg ?? 0);
    const money =
      (transport?.moneyWon ?? 0) + (electricity?.moneyWon ?? 0) + (consumption?.moneyWon ?? 0);

    return { co2, money };
  }, [transport, electricity, consumption]);

  return (
    <>
      {/* 타이틀 */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 h-10 w-10 rounded-full hover:bg-[var(--color-grey-150)] flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={24} strokeWidth={2} color="var(--color-grey-750)" />
          </button>
          <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">오늘의 기록 요약</h1>
        </div>
      </div>

      {/* 카테고리별 카드 */}
      <Card>
        {isEmpty ? (
          <div className="py-1 text-center">
            <div className="label1 text-[var(--color-grey-950)]">아직 입력된 기록이 없어요</div>
            <p className="mt-2 body2 text-[var(--color-grey-550)]">
              교통/전기/소비를 저장하면 요약이 표시돼요
            </p>

            <button
              type="button"
              onClick={() => navigate("/input")}
              className="mt-8 h-12 w-full rounded-2xl label1 bg-[var(--color-grey-150)] text-[var(--color-grey-950)]"
            >
              입력하러 가기
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            {blocks.map((b) => (
              <div key={b.title} className="text-center">
                <div className="label2 text-[var(--color-grey-950)]">{b.title}</div>
                <SoftBox>
                  <KeyValueRows rows={b.rows} />
                </SoftBox>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 총 배출량 */}
      <div className="px-5 mt-10">
        <h2 className="title1 text-[var(--color-black)] mb-3">총 탄소 배출량</h2>
        <div className="rounded-2xl p-5 bg-[var(--color-light-green)]/25">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="label2 text-[var(--color-grey-950)]">탄소 배출량</div>
              <div className="title1 text-[var(--color-grey-950)]">
                {total.co2.toFixed(1)} <span className="body2">kgCO₂</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="label2 text-[var(--color-grey-950)]">금전 환산</div>
              <div className="title1 text-[var(--color-grey-950)]">
                {total.money.toLocaleString()} <span className="body2">원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 분석하기 버튼 */}
      <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
        <button
          type="button"
          disabled={isEmpty}
          onClick={() => navigate("/personal/analyzation")}
          className={cn(
            "h-14 w-full rounded-2xl label1 text-white shadow-lg transition-all active:scale-[0.98]",
            isEmpty ? "bg-[var(--color-pale-green)]" : "bg-[var(--color-green)]"
          )}
        >
          이번 기록 분석하기
        </button>
      </div>

      <div className="h-32" />
    </>
  );
}
