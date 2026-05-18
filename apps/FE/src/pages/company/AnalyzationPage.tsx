import React, { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";
import CompanyPageHeader from "./CompanyPageHeader";
import axiosInstance from "../../api/axiosInstance";

type MonthlyPoint = { month: string; emission: number };
type ScopeData    = { name: string; description: string; value: number; change: string };
type AnomalyAlert = { message: string; changePercent: number };
type AnalysisData = {
  trendData: MonthlyPoint[];
  scopeData: ScopeData[];
  insight: string;
  anomaly: AnomalyAlert | null;
};

const COLORS = ["#B8CD7A", "#8DA75F", "#617B3B"];

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

function ScopeTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--color-light-green)] bg-white px-4 py-3 shadow-md">
      <p className="caption1 text-[var(--color-black)]">{data.name} ({data.value}%)</p>
      <p className="mt-1 caption2 text-[var(--color-grey-550)]">{data.description}</p>
      <p className="caption2 text-[var(--color-grey-550)]">전월 대비 {data.change}</p>
    </div>
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

  const trendData = data?.trendData ?? [];
  const scopeData = data?.scopeData ?? [];
  const insight   = data?.insight ?? "배출 데이터를 입력하면 AI 인사이트가 표시됩니다.";
  const anomaly   = data?.anomaly ?? null;

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
        {/* AI 인사이트 */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">AI 인사이트 💡</h2>
          <div className="mt-2 rounded-xl bg-[var(--color-light-green)]/30 px-6 py-4 text-center body2 leading-relaxed text-[var(--color-black)]">
            {insight}
          </div>
        </section>

        {/* 추세 그래프 */}
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

        {/* 배출 구조 분석 */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">배출 구조 분석</h2>
          <Card className="mt-2">
            <div className="px-4 py-4">
              <p className="text-center body2 text-[var(--color-grey-550)]">Scope별 비중과 전월 대비 변화</p>
              {scopeData.every(s => s.value === 0) ? (
                <div className="flex h-[170px] items-center justify-center">
                  <p className="body2 text-[var(--color-grey-450)]">데이터가 없습니다</p>
                </div>
              ) : (
                <div className="relative mt-2 flex items-center justify-center gap-4">
                  <div className="h-[170px] w-[190px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<ScopeTooltip />} />
                        <Pie data={scopeData} dataKey="value" cx="50%" cy="50%" outerRadius={70} stroke="none">
                          {scopeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid gap-2">
                    {scopeData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2 caption2 text-[var(--color-black)]">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* 이상치 탐지 */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">이상치 탐지</h2>
          {anomaly ? (
            <div className="mt-2 flex h-15 items-center justify-center gap-4 border border-[var(--color-grey-250)] bg-white px-4 py-3">
              <AlertTriangle size={22} className="shrink-0 text-red-600" />
              <p className="body2 text-[var(--color-black)]">
                {anomaly.message.replace(/(\d+\.?\d*)%/, (_, n) => (
                  `<span class="label1 text-red-600">${n}%</span>`
                ))}
              </p>
            </div>
          ) : (
            <div className="mt-2 flex h-15 items-center justify-center border border-[var(--color-grey-250)] bg-white px-4 py-3">
              <p className="body2 text-[var(--color-grey-450)]">이상치가 감지되지 않았습니다.</p>
            </div>
          )}
        </section>

        {/* ESG 탄소 보고서 */}
        <section className="mt-3 rounded-lg border border-[var(--color-green)] bg-white px-6 py-3">
          <h2 className="text-center title1 text-[var(--color-black)]">ESG 탄소 보고서</h2>
          <p className="mt-1 text-center caption2 text-[var(--color-grey-550)]">
            최근 분석 결과를 PDF로 저장할 수 있어요
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <button
              type="button"
              className="h-11 rounded-lg bg-[var(--color-grey-350)] body1 text-white opacity-50 cursor-not-allowed"
              disabled
            >
              미리보기
            </button>
            <button
              type="button"
              className="h-11 rounded-lg bg-[var(--color-grey-350)] body1 text-white opacity-50 cursor-not-allowed"
              disabled
            >
              PDF 다운로드
            </button>
          </div>
          <p className="mt-2 text-center caption2 text-[var(--color-grey-450)]">준비 중</p>
        </section>
      </main>
    </div>
  );
}
