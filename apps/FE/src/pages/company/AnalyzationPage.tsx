import React, { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";
import CompanyPageHeader from "./CompanyPageHeader";
import axiosInstance from "../../api/axiosInstance";

type MonthlyPoint = { month: string; emission: number };
type ScopeData = {
  name: string;
  description: string;
  value: number;
  change: string;
  changePercent: number | null;
};
type AnomalyAlert = { message: string; changePercent: number };
type AnalysisData = {
  trendData: MonthlyPoint[];
  scopeData: ScopeData[];
  totalKgCo2: number;
  insight: string;
  anomaly: AnomalyAlert | null;
};

// Scope 1 = 연두, Scope 2 = 올리브, Scope 3 = 회색
const SCOPE_COLORS = ["#B8CD7A", "#617B3B", "#9CA3AF"];

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-[var(--color-grey-250)] bg-white ${className ?? ""}`}>
      {children}
    </div>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="relative flex h-10 items-center justify-center rounded-full border border-[var(--color-grey-250)] bg-white body2 text-[var(--color-black)]"
    >
      <span>{label}</span>
      <ChevronDown size={16} className="absolute right-5 text-[var(--color-grey-550)]" />
    </button>
  );
}

/** 전월 대비 증감 배지 컴포넌트 */
function ChangeBadge({ changePercent }: { changePercent: number | null }) {
  if (changePercent === null) {
    return <span className="caption2 text-[var(--color-grey-450)]">전월 없음</span>;
  }
  const isUp = changePercent > 0;
  const isFlat = changePercent === 0;
  const formatted = `${Math.abs(changePercent).toFixed(1)}%`;

  if (isFlat) {
    return <span className="caption2 text-[var(--color-grey-550)]">― {formatted}</span>;
  }
  return isUp ? (
    <span className="caption2 font-bold text-red-500">▲ +{formatted}</span>
  ) : (
    <span className="caption2 font-bold text-blue-500">▼ -{formatted}</span>
  );
}

/** 이상치 메시지 — 숫자%를 빨간색으로 강조 */
function AnomalyMessage({ message }: { message: string }) {
  const parts = message.split(/(\d+\.?\d*%)/);
  return (
    <p className="body2 text-[var(--color-black)]">
      {parts.map((part, i) =>
        /^\d+\.?\d*%$/.test(part)
          ? <span key={i} className="label1 text-red-600">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
}

export default function BusinessAnalyzationPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get<any, AnalysisData>("/company/dashboard/analysis")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trendData  = data?.trendData  ?? [];
  const scopeData  = data?.scopeData  ?? [];
  const totalKgCo2 = data?.totalKgCo2 ?? 0;
  const insight    = data?.insight    ?? "배출 데이터를 입력하면 AI 인사이트가 표시됩니다.";
  const anomaly    = data?.anomaly    ?? null;

  const hasScope = scopeData.some(s => s.value > 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="body2 text-[var(--color-grey-450)]">분석 데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <CompanyPageHeader title="기업 탄소 분석" />

      <main className="mt-8 grid gap-8">

        {/* ── AI 인사이트 ─────────────────────────────────── */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">AI 인사이트 💡</h2>
          <div className="mt-2 rounded-xl bg-[var(--color-light-green)]/30 px-6 py-4 text-center body2 leading-relaxed text-[var(--color-black)]">
            {insight}
          </div>
        </section>

        {/* ── 추세 그래프 ──────────────────────────────────── */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">추세 그래프</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FilterButton label="최근 6개월" />
            <FilterButton label="전체 Scope" />
          </div>
          <Card className="mt-2">
            <div className="px-3 py-3">
              <p className="text-center body2 text-[var(--color-grey-550)]">
                월별 총 탄소 배출량 변화 (tCO₂e)
              </p>
              {trendData.length === 0 ? (
                <div className="flex h-[190px] items-center justify-center">
                  <p className="body2 text-[var(--color-grey-450)]">데이터가 없습니다</p>
                </div>
              ) : (
                <div className="mt-2 h-[190px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(v) => [`${v} tCO₂e`, "배출량"]}
                        contentStyle={{ fontSize: "13px", padding: "8px 10px", borderRadius: "10px", border: "1px solid #E5E7EB" }}
                        labelStyle={{ fontSize: "13px" }}
                        itemStyle={{ fontSize: "13px", color: "#7A9650" }}
                      />
                      <Line type="monotone" dataKey="emission" stroke="var(--color-green)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* ── 배출 구조 분석 (도넛 차트) ───────────────────── */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">배출 구조 분석</h2>
          <Card className="mt-2">
            <div className="px-4 py-4">
              <p className="text-center body2 text-[var(--color-grey-550)]">
                Scope별 비중과 전월 대비 변화
              </p>

              {!hasScope ? (
                <div className="flex h-[200px] items-center justify-center">
                  <p className="body2 text-[var(--color-grey-450)]">데이터가 없습니다</p>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-4">
                  {/* 도넛 차트 */}
                  <div className="relative h-[180px] w-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scopeData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          stroke="none"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {scopeData.map((_, i) => (
                            <Cell key={i} fill={SCOPE_COLORS[i] ?? "#ccc"} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload as ScopeData;
                            return (
                              <div className="rounded-xl border border-[var(--color-light-green)] bg-white px-3 py-2 shadow-md">
                                <p className="caption1 font-bold text-[var(--color-black)]">{d.name} {d.value}%</p>
                                <p className="caption2 text-[var(--color-grey-550)]">{d.description}</p>
                                <p className="caption2 text-[var(--color-grey-550)]">전월 대비 {d.change}</p>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* 중앙 합계 */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[13px] font-bold text-[#1F2937] leading-tight">
                        {totalKgCo2 >= 1000
                          ? `${(totalKgCo2 / 1000).toFixed(1)}t`
                          : `${totalKgCo2.toFixed(0)}kg`}
                      </span>
                      <span className="text-[10px] text-[#6B7280] leading-tight">kgCO₂e</span>
                    </div>
                  </div>

                  {/* 범례: Scope명 + 비중% + 전월 대비 */}
                  <div className="w-full grid gap-2">
                    {scopeData.map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm"
                            style={{ backgroundColor: SCOPE_COLORS[i] ?? "#ccc" }}
                          />
                          <div>
                            <span className="caption1 font-medium text-[var(--color-black)]">{item.name}</span>
                            <span className="caption2 text-[var(--color-grey-550)] ml-1">{item.value.toFixed(1)}%</span>
                          </div>
                        </div>
                        <ChangeBadge changePercent={item.changePercent ?? null} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* ── 이상치 탐지 ──────────────────────────────────── */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">이상치 탐지</h2>
          {anomaly ? (
            <div className="mt-2 flex items-center gap-4 border border-[var(--color-grey-250)] bg-white px-4 py-3 rounded-lg">
              <AlertTriangle size={22} className="shrink-0 text-red-600" />
              <AnomalyMessage message={anomaly.message} />
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-center border border-[var(--color-grey-250)] bg-white px-4 py-3 rounded-lg">
              <p className="body2 text-[var(--color-grey-450)]">이상치가 감지되지 않았습니다.</p>
            </div>
          )}
        </section>

        {/* ── ESG 탄소 보고서 ───────────────────────────────── */}
        <section className="mt-3 rounded-lg border border-[var(--color-green)] bg-white px-6 py-3">
          <h2 className="text-center title1 text-[var(--color-black)]">ESG 탄소 보고서</h2>
          <p className="mt-1 text-center caption2 text-[var(--color-grey-550)]">
            최근 분석 결과를 PDF로 저장할 수 있어요
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <button type="button" disabled
              className="h-11 rounded-lg bg-[var(--color-grey-350)] body1 text-white opacity-50 cursor-not-allowed">
              미리보기
            </button>
            <button type="button" disabled
              className="h-11 rounded-lg bg-[var(--color-grey-350)] body1 text-white opacity-50 cursor-not-allowed">
              PDF 다운로드
            </button>
          </div>
          <p className="mt-2 text-center caption2 text-[var(--color-grey-450)]">준비 중</p>
        </section>
      </main>
    </div>
  );
}
