import React from "react";
import {
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { useNavigate } from "react-router-dom";
import CompanyPageHeader from "./CompanyPageHeader";

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border border-[var(--color-grey-250)] bg-white ${className ?? ""}`}
    >
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

      <ChevronDown
        size={16}
        className="absolute right-5 text-[var(--color-grey-550)]"
      />
    </button>
  );
}

function ScopeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-xl border border-[var(--color-light-green)] bg-white px-4 py-3 shadow-md">
      <p className="caption1 text-[var(--color-black)]">
        {data.name} ({data.value}%)
      </p>

      <p className="mt-1 caption2 text-[var(--color-grey-550)]">
        {data.description}
      </p>

      <p className="caption2 text-[var(--color-grey-550)]">
        전월 대비 {data.change}
      </p>
    </div>
  );
}

export default function BusinessAnalyzationPage() {
  const navigate = useNavigate();

  const trendData = [
    { month: "1월", emission: 82 },
    { month: "2월", emission: 125 },
    { month: "3월", emission: 143 },
    { month: "5월", emission: 58 },
    { month: "6월", emission: 115 },
    { month: "7월", emission: 78 },
  ];

  const scopeData = [
    {
        name: "Scope 1",
        value: 37,
        description: "직접 배출 (연료, 차량, 공정)",
        change: "-5%",
    },
    {
        name: "Scope 2",
        value: 33,
        description: "간접 배출 (전력 사용)",
        change: "+8%",
    },
    {
        name: "Scope 3",
        value: 30,
        description: "기타 간접 배출",
        change: "-2%",
    },
  ];

  const COLORS = ["#B8CD7A", "#8DA75F", "#617B3B"];

  return (
    <div className="pb-28">
      {/* 타이틀 */}
      <CompanyPageHeader title="기업 탄소 분석" />

      <main className="mt-8 grid gap-8">
        {/* AI 인사이트 */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">
            AI 인사이트 💡
          </h2>

          <div className="mt-2 rounded-xl bg-[var(--color-light-green)]/30 px-6 py-4 text-center body2 leading-relaxed text-[var(--color-black)]">
            이번 달 배출 증가의 주요 원인은{" "}
            <span className="label1">Scope 2 증가</span>입니다.
            <br />
            특히 전력 사용 증가가 배출량 상승에 영향을 준 것으로 보입니다.
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
                월별 총 탄소 배출량 변화
              </p>

              <div className="mt-2 h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 160]} />
                    <Tooltip
                      formatter={(value) => [`${value} kgCO₂`, "배출량"]}
                      contentStyle={{
                        fontSize: "13px",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid #E5E7EB",
                      }}
                      labelStyle={{
                        fontSize: "13px",
                     }}
                      itemStyle={{
                        fontSize: "13px",
                        color: "#7A9650",
                      }}
                    /> 
                    <Line
                      type="monotone"
                      dataKey="emission"
                      stroke="var(--color-green)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-2 text-center caption2 text-[var(--color-grey-650)]">
                최근 3개월 간 배출량이 15% 감소했어요
              </p>
            </div>
          </Card>
        </section>

        {/* 배출 구조 분석 */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">배출 구조 분석</h2>

          <Card className="mt-2">
            <div className="px-4 py-4">
              <p className="text-center body2 text-[var(--color-grey-550)]">
                Scope별 비중과 전월 대비 변화
              </p>

              <div className="relative mt-2 flex items-center justify-center gap-4">

                <div className="h-[170px] w-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<ScopeTooltip />} />

                      <Pie
                        data={scopeData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        stroke="none"
                      >
                        {scopeData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-2">
                  {scopeData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 caption2 text-[var(--color-black)]"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 이상치 탐지 */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">이상치 탐지</h2>

          <div className="mt-2 flex h-15 items-center justify-center gap-4 border border-[var(--color-grey-250)] bg-white">
            <AlertTriangle size={22} className="text-red-600" />
            <p className="body2 text-[var(--color-black)]">
              3월 전력 배출량이 최근 평균 대비{" "}
              <span className="label1 text-red-600">28%</span> 높습니다
            </p>
          </div>
        </section>

        {/* ESG 탄소 보고서 */}
        <section className="mt-3 rounded-lg border border-[var(--color-green)] bg-white px-6 py-3">
          <h2 className="text-center title1 text-[var(--color-black)]">
            ESG 탄소 보고서
          </h2>
          <p className="mt-1 text-center caption2 text-[var(--color-grey-550)]">
            최근 분석 결과를 PDF로 저장할 수 있어요
          </p>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate("/business/analyzation/report-preview")}
              className="h-11 rounded-lg bg-[var(--color-grey-350)] body1 text-white"
            >
              미리보기
            </button>

            <button
              type="button"
              onClick={() => alert("PDF 다운로드")}
              className="h-11 rounded-lg bg-[var(--color-green)] body1 text-white"
            >
              PDF 다운로드
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
