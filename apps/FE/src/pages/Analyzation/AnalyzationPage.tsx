// const AnalyzationPage = () => {
//   return (
//     <div>
//       <div className="flex flex-col items-center justify-center px-4 pb-[90px]">
//         <h1 className="text-2xl font-semibold text-gray-900">
//           Analyzation Page
//         </h1>

//         <p className="mt-2 text-gray-500">
//           분석 페이지입니다. 정상적으로 렌더링되고 있어요 👍
//         </p>

//         {/* 나중에 여기에 차트, 카드, 테이블 */}
//         <div className="mt-6 w-full max-w-md rounded-lg bg-white p-4 shadow">
//           <p className="text-sm text-gray-600">
//             📊 분석 데이터 영역 (placeholder)
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingDown, Layers3, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const trendData = [
  { month: "1월", actual: 80, target: 80 },
  { month: "2월", actual: 125, target: 75 },
  { month: "3월", actual: 140, target: 70 },
  { month: "4월", actual: 55, target: 65 },
  { month: "5월", actual: 115, target: 60 },
  { month: "6월", actual: 80, target: 55 },
];

const categoryData = [
  { name: "전기", prev: 24, curr: 18 },
  { name: "소비/배달", prev: 25, curr: 14 },
  { name: "교통", prev: 28, curr: 31 },
  { name: "기타", prev: 19, curr: 24 },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[var(--color-grey-250)] bg-white px-3 py-[10px]">
      {children}
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  desc,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  desc: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col ">
      <div className="flex items-center gap-[7px] caption1 text-[var(--color-grey-650)] mb-[6px]">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-xl ${
            danger
              ? "bg-[rgba(255,193,7,0.18)] text-[rgba(181,137,0,1)]"
              : "bg-[#e5ecd6] text-[var(--color-green)]"
          }`}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="label1 pl-1 text-black">{value}</div>
      <div className="caption2 pl-1 leading-4 text-[var(--color-grey-550)]">
        {desc}
      </div>
    </div>
  );
}

export default function AnalyzationPage() {
  const navigate = useNavigate();
  return (
    <div>
      <div>
        <div className="flex items-center justify-center py-1">
          <div className="h0 text-[var(--color-green)]">탄소 기록 분석</div>
        </div>

        <main className="mt-6">
          {/* 탄소 배출량 분석 */}
          <div className="space-y-1 mb-5">
            <div className="title1 text-[var(--color-black)]">
              탄소 배출량 분석
            </div>

            <Card>
              <div className="flex gap-2">
                <div className="flex-1">
                  <StatItem
                    icon={<TrendingDown className="h-4 w-4" />}
                    label="개선 추세"
                    value="-18%"
                    desc="지난 3개월 평균 대비"
                  />
                </div>

                <div className="w-px bg-[var(--color-grey-250)]" />

                <div className="flex-[1.1]">
                  <StatItem
                    icon={<Layers3 className="h-4 w-4" />}
                    label="데이터 신뢰도"
                    value="94%"
                    desc="검증 완료 데이터 비율"
                  />
                </div>

                <div className="w-px bg-[var(--color-grey-250)]" />

                <div className="flex-1">
                  <StatItem
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label="주의 필요"
                    value="2건"
                    desc="이상 패턴 감지됨"
                    danger
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* 탄소 배출량 추세 분석 */}
          <div className="space-y-1 mb-5">
            <div className="title1 text-[var(--color-black)]">
              탄소 배출량 추세 분석
            </div>

            <Card>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 160]} />
                    <Tooltip />
                    <Legend align="center" wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="실제 배출량"
                      stroke="var(--color-green)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="목표 배출량"
                      stroke="var(--color-grey-550)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="space-y-1 mb-5">
            <div className="title1 text-[var(--color-black)]">
              카테고리별 비교
            </div>

            <Card>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 31]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="prev"
                      fill="var(--color-grey-550)"
                      name="저번 달"
                    />
                    <Bar
                      dataKey="curr"
                      fill="var(--color-green)"
                      name="이번 달"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <button
            className="flex label1 items-center justify-center mt-1 w-full h-12 rounded-[8px] bg-[var(--color-green)] text-[var(--color-white)] cursor-pointer"
            type="button"
            onClick={() => {
              navigate("/personal/analyzation/scenario");
            }}
          >
            개인 맞춤 탄소 절감 방법 추천
          </button>
        </main>
      </div>
    </div>
  );
}
