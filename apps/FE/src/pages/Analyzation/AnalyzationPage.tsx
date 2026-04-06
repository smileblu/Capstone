import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAnalysis } from "../../api/analysisService";
import type { AnalysisResponse } from "../../types/analysis";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[var(--color-grey-250)] bg-white px-3 py-[10px]">
      {children}
    </div>
  );
}

function StatItem({ icon, label, value, desc, danger }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  desc: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-[7px] caption1 text-[var(--color-grey-650)] mb-[6px]">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-xl ${
          danger
            ? "bg-[rgba(255,193,7,0.18)] text-[rgba(181,137,0,1)]"
            : "bg-[#e5ecd6] text-[var(--color-green)]"
        }`}>
          {icon}
        </span>
        {label}
      </div>
      <div className="label1 pl-1 text-black">{value}</div>
      <div className="caption2 pl-1 leading-4 text-[var(--color-grey-550)]">{desc}</div>
    </div>
  );
}

export default function AnalyzationPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    getAnalysis()
      .then(setData)
      .catch((e) => console.error("분석 데이터 로드 실패:", e));
  }, []);

  const isImproving = data ? data.improvementRate <= 0 : true;
  const improvementLabel = data
    ? `${data.improvementRate > 0 ? "+" : ""}${data.improvementRate.toFixed(1)}%`
    : "-";

  return (
    <div>
      <div className="flex items-center justify-center py-1">
        <div className="h0 text-[var(--color-dark-green)]">탄소 기록 분석</div>
      </div>

      <main className="mt-6">
        {/* 탄소 배출량 분석 */}
        <div className="space-y-1 mb-5">
          <div className="title1 text-[var(--color-black)]">탄소 배출량 분석</div>
          <Card>
            <div className="flex gap-2">
              <div className="flex-1">
                <StatItem
                  icon={isImproving
                    ? <TrendingDown className="h-4 w-4" />
                    : <TrendingUp className="h-4 w-4" />}
                  label={isImproving ? "개선 추세" : "증가 추세"}
                  value={improvementLabel}
                  desc="지난 주 대비"
                />
              </div>
              <div className="w-px bg-[var(--color-grey-250)]" />
              <div className="flex-1">
                <StatItem
                  icon={<AlertTriangle className="h-4 w-4" />}
                  label="주의 필요"
                  value={data ? `${data.warningCount}건` : "-"}
                  desc="이상 패턴 감지됨"
                  danger
                />
              </div>
            </div>
          </Card>
        </div>

        {/* 탄소 배출량 추세 분석 */}
        <div className="space-y-1 mb-5">
          <div className="title1 text-[var(--color-black)]">탄소 배출량 추세 분석</div>
          <Card>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data?.weeklyTrend ?? []}
                  margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend align="center" wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone" dataKey="actual" name="실제 배출량"
                    stroke="var(--color-green)" strokeWidth={2}
                    dot={{ r: 3 }} connectNulls={false}
                  />
                  <Line
                    type="monotone" dataKey="target" name="목표 배출량"
                    stroke="var(--color-grey-550)" strokeWidth={2}
                    strokeDasharray="4 4" dot={{ r: 3 }} connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 카테고리별 비교 */}
        <div className="space-y-1 mb-5">
          <div className="title1 text-[var(--color-black)]">카테고리별 비교</div>
          <Card>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.categoryComparison ?? []}
                  margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="prevWeek" fill="var(--color-grey-550)" name="지난주" />
                  <Bar dataKey="currWeek" fill="var(--color-green)" name="이번주" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <button
          className="flex label1 items-center justify-center mt-1 w-full h-12 rounded-[8px] bg-[var(--color-green)] text-[var(--color-white)] cursor-pointer"
          type="button"
          onClick={() => navigate("/personal/analyzation/scenario")}
        >
          개인 맞춤 탄소 절감 방법 추천
        </button>
      </main>
    </div>
  );
}
