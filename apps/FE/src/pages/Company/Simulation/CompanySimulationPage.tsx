import React, { useState, useEffect } from "react";
import { getSimulation } from "../../../api/company/companySimulationService";
import type { ScenarioInfo } from "../../../api/company/companySimulationService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts";
import CompanyPageHeader from "../CompanyPageHeader";

// ── 타입 ───────────────────────────────────────────────────────────────────────

type TabType = "emission" | "cost-benefit";
type SelectedScenario = "A" | "B" | "C" | null;

type EmissionPoint = {
  year: number;
  actual: number | null;
  current: number | null;
  scenarioA: number | null;
  scenarioB: number | null;
  scenarioC: number | null;
};

type BubblePoint = {
  x: number;
  y: number;
  z: number;
  label: string;
  recommended: boolean;
  recoveryYear: number;
};

// ── 더미 데이터 ────────────────────────────────────────────────────────────────

const bubbleData: BubblePoint[] = [
  { x: 3000,  y: 10000, z: 800, label: "시나리오 1", recommended: true,  recoveryYear: 3 },
  { x: 8500,  y: 11000, z: 600, label: "시나리오 2", recommended: false, recoveryYear: 5 },
  { x: 1500,  y: 4000,  z: 400, label: "시나리오 3", recommended: false, recoveryYear: 4 },
  { x: 7500,  y: 2500,  z: 300, label: "시나리오 4", recommended: false, recoveryYear: 7 },
];

// ── 서브 컴포넌트 ──────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-9 items-center justify-center rounded-full px-5 body2 transition-colors",
        active
          ? "bg-[var(--color-green)] text-white"
          : "border border-[var(--color-grey-350)] bg-white text-[var(--color-grey-750)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// 버블 차트용 커스텀 dot
const BubbleDot = (props: any) => {
  const { cx, cy, payload } = props;
  const r = Math.sqrt(payload.z) * 0.55;
  const fill = payload.recommended ? "#7da453" : "#a8c66c";
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.85} />
      <text
        x={cx + r + 4}
        y={cy + 4}
        fontSize={10}
        fill="#555"
        fontFamily="Pretendard, sans-serif"
      >
        {payload.label}
      </text>
    </g>
  );
};

// ── 배출량 라인 차트 ───────────────────────────────────────────────────────────

function EmissionChart({
  data,
  monthLabels,
  selected,
}: {
  data: EmissionPoint[];
  monthLabels: string[];
  selected: SelectedScenario;
}) {
  const monthLabel = (year: number) => monthLabels[year - 1] ?? `${year}`;
  const currentYear = 3;

  // 선택된 시나리오가 있으면 해당 선만, 없으면 전부 표시
  const showA = selected === null || selected === "A";
  const showB = selected === null || selected === "B";
  const showC = selected === null || selected === "C";

  const scenarioLines: { key: "scenarioA" | "scenarioB" | "scenarioC"; stroke: string; dash?: string; label: string }[] = [
    { key: "scenarioA", stroke: "#7da453", label: "시나리오1 배출량" },
    { key: "scenarioB", stroke: "#5c7b37", dash: "6 3", label: "시나리오2 배출량" },
    { key: "scenarioC", stroke: "#a8c66c", dash: "2 3", label: "시나리오3 배출량" },
  ];

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-4">
      <ResponsiveContainer width="100%" height={274}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11 }}
            tickFormatter={monthLabel}
          />
          <ReferenceLine
            x={currentYear}
            stroke="#545454"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: "현재",
              position: "insideTopRight",
              fontSize: 11,
              fill: "#545454",
              fontWeight: "bold",
            }}
          />
          <YAxis
            domain={[60, 180]}
            ticks={[60, 90, 120, 150, 180]}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }}
            formatter={
              ((v: any, name: string | undefined) => {
                const labels: Record<string, string> = {
                  actual: "실제 배출량",
                  current: "현재 유지시 배출량",
                  scenarioA: "시나리오1 배출량",
                  scenarioB: "시나리오2 배출량",
                  scenarioC: "시나리오3 배출량",
                };
                return [v ?? "-", name ? (labels[name] ?? name) : ""];
              }) as any
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                actual: "실제 배출량",
                current: "현재 유지시 배출량",
                scenarioA: "시나리오1 배출량",
                scenarioB: "시나리오2 배출량",
                scenarioC: "시나리오3 배출량",
              };
              return labels[value] ?? value;
            }}
          />
          {/* 항상 표시: 실제 배출량 + 현재 유지시 */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#000"
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#888"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />
          {/* 시나리오 선 (선택 상태에 따라 표시/숨김) */}
          {scenarioLines.map(({ key, stroke, dash, label }, i) => {
            const show = [showA, showB, showC][i];
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={show ? key : "__hidden__"}
                name={key}
                stroke={stroke}
                strokeWidth={key === "scenarioA" ? 2 : 1.5}
                strokeDasharray={dash}
                dot={false}
                connectNulls
                hide={!show}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 비용-편익 버블 차트 ────────────────────────────────────────────────────────

const CustomBubbleTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: BubblePoint = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-2 shadow-md text-[11px]">
      <p className="font-bold text-[var(--color-black)]">{d.label}</p>
      <p className="text-[var(--color-grey-550)]">투자 비용: {d.x.toLocaleString()}원</p>
      <p className="text-[var(--color-grey-550)]">예상 편익: {d.y.toLocaleString()}원</p>
      <p className="text-[var(--color-grey-550)]">감축량: {d.z}kg CO₂</p>
      <p className="text-[var(--color-grey-550)]">회수기간: {d.recoveryYear}년</p>
    </div>
  );
};

function CostBenefitChart() {
  return (
    <div className="mt-3 rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-4">
      <div className="flex items-center gap-4 mb-2 px-1">
        <span className="text-[10px] text-[var(--color-grey-550)]">점 크기 = 감축량</span>
        <span className="text-[10px] text-[var(--color-grey-550)]">점 색 = 회수기간</span>
        <div className="ml-auto flex items-center gap-1">
          {["빠름", "", "", "", "", "김"].map((label, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: `hsl(${100 - i * 10}, 40%, ${55 + i * 4}%)`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={232}>
        <ScatterChart margin={{ top: 10, right: 40, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            dataKey="x"
            name="투자 비용"
            domain={[0, 10000]}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            tick={{ fontSize: 10 }}
            label={{ value: "투자 비용(원)", position: "insideBottom", offset: -10, fontSize: 10, fill: "#8e8e8e" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="예상 편익"
            domain={[0, 12500]}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            tick={{ fontSize: 10 }}
            label={{ value: "예상 편익(원)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#8e8e8e" }}
          />
          <ZAxis type="number" dataKey="z" range={[600, 2800]} />
          <Tooltip content={<CustomBubbleTooltip />} />
          <ReferenceLine x={5000} stroke="#a8c66c" strokeDasharray="4 3" strokeWidth={1} />
          <ReferenceLine y={6000} stroke="#a8c66c" strokeDasharray="4 3" strokeWidth={1} />
          <Scatter data={bubbleData} shape={<BubbleDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-1 flex justify-start pl-2">
        <span className="text-[10px] text-[var(--color-green)]">← 좌상단: 추천 영역 (저비용·고편익)</span>
      </div>
    </div>
  );
}

// ── 시나리오 카드 ──────────────────────────────────────────────────────────────

const SCENARIO_IDS = ["A", "B", "C"] as const;

function ScenarioCardItem({
  scenario,
  index,
  selected,
  onToggle,
}: {
  scenario: ScenarioInfo;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "relative w-full text-left rounded-xl border px-4 py-3 transition-colors",
        selected
          ? "border-[var(--color-green)] bg-[var(--color-green)]/5"
          : "border-[var(--color-grey-250)] bg-white",
      ].join(" ")}
    >
      {scenario.recommended && (
        <span className="absolute top-3 right-4 rounded-full bg-[var(--color-green)] px-2 py-0.5 text-[10px] font-semibold text-white">
          AI 추천
        </span>
      )}
      <div className="flex items-center gap-2 pr-14">
        <span
          className={[
            "label2 shrink-0",
            selected ? "text-[var(--color-green)] font-bold" : "text-[var(--color-green)]",
          ].join(" ")}
        >
          {index + 1}
        </span>
        <p className="title2 text-[var(--color-black)]">{scenario.title}</p>
      </div>
      <p className="mt-0.5 body2 text-[var(--color-grey-550)]">{scenario.description}</p>
      <p className="mt-2 caption1 text-[var(--color-green)] font-semibold">
        -{scenario.co2ReductionTon.toFixed(2)}tCO₂ | {scenario.costSaving.toLocaleString()}원 절약
      </p>
    </button>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("emission");
  const [chartData, setChartData] = useState<EmissionPoint[]>([]);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);
  const [scenarioList, setScenarioList] = useState<ScenarioInfo[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<SelectedScenario>(null);

  useEffect(() => {
    getSimulation()
      .then((res) => {
        const mapped: EmissionPoint[] = res.points.map((p, i) => ({
          year: i + 1,
          actual: p.actual,
          current: p.current,
          scenarioA: p.scenarioA,
          scenarioB: p.scenarioB,
          scenarioC: p.scenarioC,
        }));
        const labels = res.points.map((p) => {
          const [, m] = p.month.split("-");
          return `${parseInt(m)}월`;
        });
        setChartData(mapped);
        setMonthLabels(labels);
        setScenarioList(res.scenarios);
      })
      .catch((e) => console.error("시뮬레이션 로드 실패:", e));
  }, []);

  const handleScenarioToggle = (id: string) => {
    const sid = id as SelectedScenario;
    setSelectedScenario((prev) => (prev === sid ? null : sid));
  };

  return (
    <div className="pb-28">
      <CompanyPageHeader title="시뮬레이션" />

      <main className="mt-6 grid gap-8">
        {/* ── AI 시계열 예측 그래프 ─────────────────────────── */}
        <section>
          <h2 className="title1 text-[var(--color-black)]">AI 시계열 예측 그래프</h2>

          <div className="mt-3 flex gap-2">
            <TabButton active={activeTab === "emission"} onClick={() => setActiveTab("emission")}>
              배출량
            </TabButton>
            <TabButton active={activeTab === "cost-benefit"} onClick={() => setActiveTab("cost-benefit")}>
              비용-편익
            </TabButton>
          </div>

          {activeTab === "emission"
            ? <EmissionChart data={chartData} monthLabels={monthLabels} selected={selectedScenario} />
            : <CostBenefitChart />}
        </section>

        {/* ── 탄소 감축 시나리오 ───────────────────────────── */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="title1 text-[var(--color-black)]">탄소 감축 시나리오</h2>
            <span className="caption2 text-[var(--color-grey-550)]">AI 추천 우선순위순</span>
          </div>
          {selectedScenario && (
            <p className="mt-1 caption2 text-[var(--color-green)]">
              시나리오 {SCENARIO_IDS.indexOf(selectedScenario) + 1} 선택됨 · 다시 누르면 전체 보기
            </p>
          )}

          <div className="mt-3 grid gap-3">
            {scenarioList.map((s, i) => (
              <ScenarioCardItem
                key={s.id}
                scenario={s}
                index={i}
                selected={selectedScenario === s.id}
                onToggle={() => handleScenarioToggle(s.id)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
