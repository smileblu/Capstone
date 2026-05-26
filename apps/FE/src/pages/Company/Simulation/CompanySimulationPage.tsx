import React, { useState, useEffect, useCallback } from "react";
import { getSimulation } from "../../../api/company/companySimulationService";
import type { ScenarioInfo, SimulationData } from "../../../api/company/companySimulationService";
import { getSimulationCache, setSimulationCache, clearSimulationCache } from "../../../api/company/simulationCache";
import { RefreshCw } from "lucide-react";
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
type LoadStep = "baseline" | "scenario" | "done";

type ChartPoint = {
  month: string;
  actual: number | null;
  current: number | null;
  scenarioA: number | null;
  scenarioB: number | null;
  scenarioC: number | null;
  isFuture: boolean;
};


// ── 상수 ───────────────────────────────────────────────────────────────────────

const SCENARIO_COLORS: Record<string, string> = {
  A: "#e6a817",   // 노랑
  B: "#4e9940",   // 초록
  C: "#2d7fc1",   // 파랑
};


// ── 헬퍼 ───────────────────────────────────────────────────────────────────────

function fmt1(v: number | null) {
  return v != null ? v.toFixed(1) : "-";
}

function fmtKrw(v: number) {
  return v.toLocaleString("ko-KR");
}

/** 회수기간(개월) → 초록 계열 색상 (빠를수록 진한 초록) */
function paybackToColor(months: number): string {
  if (months >= 9999) return "hsl(50, 40%, 75%)";
  const step  = (Math.min(months, 84) / 84) * 5;   // 0~5 (범례 6개 점 대응)
  const hue   = Math.round(100 - step * 10);        // 100 → 50
  const light = Math.round(55  + step * 4);         // 55% → 75%
  return `hsl(${hue}, 40%, ${light}%)`;
}

// ── 로딩 컴포넌트 ──────────────────────────────────────────────────────────────

const LOAD_STEPS: Record<Exclude<LoadStep, "done">, { label: string; sub: string }> = {
  baseline: { label: "시계열 모델 예측 중", sub: "ARIMA로 향후 6개월 배출량을 계산하고 있어요" },
  scenario: { label: "AI 시나리오 생성 중", sub: "기업 맞춤 감축 전략을 분석하고 있어요" },
};

function LoadingCard({ step }: { step: LoadStep }) {
  if (step === "done") return null;
  const { label, sub } = LOAD_STEPS[step];
  return (
    <div className="flex h-[calc(100vh-120px)] flex-col items-center justify-center gap-5">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-[var(--color-grey-250)] border-t-[var(--color-green)]" />
      <div className="text-center">
        <p className="title1 text-[var(--color-black)]">{label}</p>
        <p className="mt-1 body2 text-[var(--color-grey-550)]">{sub}</p>
      </div>
    </div>
  );
}

// ── 탭 버튼 ────────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: {
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

// ── 배출량 라인 차트 ───────────────────────────────────────────────────────────

function EmissionChart({ data, selected, modelUsed, currentMonthIndex }: {
  data: ChartPoint[];
  selected: SelectedScenario;
  modelUsed: string;
  currentMonthIndex: number;
}) {
  const allValues = data.flatMap((p) =>
    [p.actual, p.current, p.scenarioA, p.scenarioB, p.scenarioC].filter(
      (v): v is number => v != null
    )
  );
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 200;
  const yMin = Math.floor(minVal * 0.9);
  const yMax = Math.ceil(maxVal * 1.1);
  const step = Math.max(1, Math.ceil((yMax - yMin) / 5));
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax; t += step) ticks.push(t);

  const modelLabel =
    modelUsed === "SARIMA" ? "SARIMA 예측" :
    modelUsed === "ARIMA"  ? "ARIMA 예측" :
    "평균 기반 추정";
  const isInsufficient = modelUsed === "linear_fallback";
  const currentMonthLabel = data[currentMonthIndex]?.month;

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
        <span className="caption2 text-[var(--color-grey-550)]">예측 모델: {modelLabel}</span>
        {isInsufficient && (
          <span className="caption2 text-yellow-600">
            ⚠ 데이터가 6개월 이상 쌓이면 더 정확한 예측이 가능합니다
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={274}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis domain={[yMin, yMax]} ticks={ticks} tick={{ fontSize: 11 }} />
          <ReferenceLine
            x={currentMonthLabel}
            stroke="#545454"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: "현재", position: "insideTopRight", fontSize: 11, fill: "#545454", fontWeight: "bold" }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }}
            labelFormatter={(label) => String(label)}
            formatter={((value: any, name?: string) => {
              const labels: Record<string, string> = {
                actual:    "실제 배출량",
                current:   "현재 유지",
                scenarioA: "시나리오 A",
                scenarioB: "시나리오 B",
                scenarioC: "시나리오 C",
              };
              const key = name ?? "";
              return [`${fmt1(value as number | null)} tCO₂e`, labels[key] ?? key];
            }) as any}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                actual:    "실제 배출량",
                current:   "현재 유지",
                scenarioA: "시나리오 A",
                scenarioB: "시나리오 B",
                scenarioC: "시나리오 C",
              };
              return labels[value] ?? value;
            }}
          />
          <Line type="monotone" dataKey="actual" stroke="#000" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          <Line type="monotone" dataKey="current" stroke="#888" strokeWidth={1.5} dot={false} connectNulls />
          {(["A", "B", "C"] as const).map((id) => {
            const key = `scenario${id}` as "scenarioA" | "scenarioB" | "scenarioC";
            const show = selected === null || selected === id;
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={show ? key : "__hidden__"}
                name={key}
                stroke={SCENARIO_COLORS[id]}
                strokeWidth={1.5}
                strokeDasharray="6 3"
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

const BubbleDot = (props: any) => {
  const { cx, cy, payload } = props;
  const r    = Math.sqrt(payload.z) * 0.55;
  const fill = payload.color ?? paybackToColor(payload.paybackMonths);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.85} />
      <text x={cx + r + 4} y={cy + 4} fontSize={10} fill="#555" fontFamily="Pretendard, sans-serif">
        {payload.label}
      </text>
    </g>
  );
};

const BubbleTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const paybackStr =
    d.paybackMonths >= 9999 ? "회수 불가" :
    d.paybackMonths >= 12
      ? `${Math.floor(d.paybackMonths / 12)}년 ${Math.round(d.paybackMonths % 12)}개월`
      : `${Math.round(d.paybackMonths)}개월`;
  const roi = d.fiveYearRoi;
  const roiColor = roi == null ? "" : roi >= 0 ? "text-[var(--color-green)]" : "text-red-500";
  return (
    <div className="rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-2 shadow-md text-[11px]">
      <p className="font-bold text-[var(--color-black)]">{d.label}</p>
      <p className="text-[var(--color-grey-550)]">투자 비용: {fmtKrw(d.x)}만원</p>
      <p className="text-[var(--color-grey-550)]">예상 편익: {fmtKrw(d.y)}만원</p>
      <p className="text-[var(--color-grey-550)]">감축량: {d.co2ReductionTon?.toFixed(1)}tCO₂e</p>
      <p className="text-[var(--color-grey-550)]">회수기간: {paybackStr}</p>
      {roi != null && <p className={roiColor}>5년 ROI: {roi.toFixed(1)}%</p>}
    </div>
  );
};

function CostBenefitChart({ scenarios }: { scenarios: ScenarioInfo[] }) {
  // z: co2ReductionKg → [300, 900] 정규화
  const co2Values = scenarios.map((s) => s.co2ReductionKg);
  const minCo2    = Math.min(...co2Values);
  const maxCo2    = Math.max(...co2Values);
  const normZ     = (kg: number) =>
    maxCo2 === minCo2 ? 600 : Math.round(300 + ((kg - minCo2) / (maxCo2 - minCo2)) * 600);

  // 회수기간: 현재 데이터 내 min~max 기준 상대 정규화 → 색상 차별화
  const validPaybacks = scenarios.map((s) => s.paybackMonths).filter((v) => v < 9999);
  const minPayback    = Math.min(...validPaybacks);
  const maxPayback    = Math.max(...validPaybacks);
  const normPaybackColor = (months: number): string => {
    if (months >= 9999) return "hsl(50, 40%, 75%)";
    const ratio = maxPayback === minPayback
      ? 0
      : (months - minPayback) / (maxPayback - minPayback);
    const step  = ratio * 5;
    return `hsl(${Math.round(100 - step * 10)}, 40%, ${Math.round(55 + step * 4)}%)`;
  };

  const bubbleData = scenarios.map((s) => ({
    x:              Math.round(s.investmentCostKrw / 10_000),
    y:              Math.round(s.costSavingKrw / 10_000),
    z:              normZ(s.co2ReductionKg),
    label:          `시나리오 ${s.id}`,
    recommended:    s.recommended,
    paybackMonths:  s.paybackMonths,
    color:          normPaybackColor(s.paybackMonths),
    co2ReductionTon: s.co2ReductionTon,
    fiveYearRoi:    s.fiveYearRoiPct,
  }));

  const maxX    = Math.max(...bubbleData.map((d) => d.x), 500);
  const maxY    = Math.max(...bubbleData.map((d) => d.y), 500);
  const domainX = Math.ceil(maxX * 1.4);
  const domainY = Math.ceil(maxY * 1.4);
  const midX    = Math.round(domainX / 2);
  const midY    = Math.round(domainY / 2);

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-4">
      {/* 범례 */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <span className="text-[10px] text-[var(--color-grey-550)]">점 크기 = 감축량</span>
        <span className="text-[10px] text-[var(--color-grey-550)]">점 색 = 회수기간</span>
        <div className="ml-auto flex items-center gap-1">
          {["빠름", "", "", "", "", "김"].map((_label, i) => (
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
            domain={[0, domainX]}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}천만` : `${v}만`}
            tick={{ fontSize: 10 }}
            label={{ value: "투자 비용(만원)", position: "insideBottom", offset: -10, fontSize: 10, fill: "#8e8e8e" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="예상 편익"
            domain={[0, domainY]}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}천만` : `${v}만`}
            tick={{ fontSize: 10 }}
            label={{ value: "예상 편익(만원)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#8e8e8e" }}
          />
          <ZAxis type="number" dataKey="z" range={[600, 2800]} />
          <Tooltip content={<BubbleTooltip />} />
          {/* 사분면 구분선 */}
          <ReferenceLine x={midX} stroke="#a8c66c" strokeDasharray="4 3" strokeWidth={1} />
          <ReferenceLine y={midY} stroke="#a8c66c" strokeDasharray="4 3" strokeWidth={1} />
          <Scatter data={bubbleData} shape={<BubbleDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-1 flex justify-start pl-2">
        <span className="text-[10px] text-[var(--color-green)]">← 좌상단: 추천 영역 (저비용·고편익)</span>
      </div>
    </div>
  );
}

// ── 시나리오 요약 카드 ─────────────────────────────────────────────────────────

function ScenarioSummaryCard({ scenario, selected, onToggle }: {
  scenario: ScenarioInfo;
  selected: boolean;
  onToggle: () => void;
}) {
  const paybackStr =
    scenario.paybackMonths >= 9999 ? "회수 불가" :
    scenario.paybackMonths >= 12
      ? `${Math.floor(scenario.paybackMonths / 12)}년 ${Math.round(scenario.paybackMonths % 12)}개월`
      : `${Math.round(scenario.paybackMonths)}개월`;

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
          className="label2 shrink-0 text-[var(--color-green)]"
          style={{ color: SCENARIO_COLORS[scenario.id] ?? "var(--color-green)" }}
        >
          {scenario.id}
        </span>
        <p className="title2 text-[var(--color-black)]">{scenario.name}</p>
      </div>

      <p className="mt-0.5 body2 text-[var(--color-grey-550)]">{scenario.description}</p>

      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="caption2 text-[var(--color-grey-450)]">6개월 절감</p>
          <p className="caption1 font-semibold text-[var(--color-green)]">{scenario.co2ReductionTon.toFixed(1)}tCO₂</p>
        </div>
        <div>
          <p className="caption2 text-[var(--color-grey-450)]">비용 절감</p>
          <p className="caption1 font-semibold text-[var(--color-green)]">{fmtKrw(scenario.costSavingKrw)}원</p>
        </div>
        <div>
          <p className="caption2 text-[var(--color-grey-450)]">회수기간</p>
          <p className="caption1 font-semibold text-[var(--color-black)]">{paybackStr}</p>
        </div>
      </div>
    </button>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const [activeTab, setActiveTab]        = useState<TabType>("emission");
  const [chartData, setChartData]        = useState<ChartPoint[]>([]);
  const [scenarioList, setScenarioList]  = useState<ScenarioInfo[]>([]);
  const [selectedScenario, setSelected]  = useState<SelectedScenario>(null);
  const [modelUsed, setModelUsed]        = useState<string>("linear_fallback");
  const [currentMonthIdx, setCurrentIdx] = useState<number>(2);
  const [loadStep, setLoadStep]          = useState<LoadStep>("baseline");
  const [loading, setLoading]            = useState(true);
  const [fromCache, setFromCache]        = useState(false);

  const applySimulationData = useCallback((res: SimulationData) => {
    setModelUsed(res.modelUsed ?? "linear_fallback");
    setScenarioList(res.scenarios ?? []);
    const mapped: ChartPoint[] = res.points.map((p) => {
      const [, m] = p.month.split("-");
      return {
        month:     `${parseInt(m)}월`,
        actual:    p.actual,
        current:   p.current,
        scenarioA: p.scenarioA,
        scenarioB: p.scenarioB,
        scenarioC: p.scenarioC,
        isFuture:  p.actual == null && p.current != null,
      };
    });
    setChartData(mapped);
    const lastActualIdx = res.points.reduce(
      (acc, p, i) => (p.actual != null ? i : acc), 0
    );
    setCurrentIdx(lastActualIdx);
  }, []);

  const fetchFresh = useCallback(() => {
    setLoading(true);
    setFromCache(false);
    setLoadStep("baseline");
    const t = setTimeout(() => setLoadStep("scenario"), 1200);

    getSimulation()
      .then((res) => {
        clearTimeout(t);
        setSimulationCache(res);
        applySimulationData(res);
        setLoadStep("done");
        setLoading(false);
      })
      .catch((e) => {
        clearTimeout(t);
        console.error("시뮬레이션 로드 실패:", e);
        setLoading(false);
      });
  }, [applySimulationData]);

  useEffect(() => {
    const cached = getSimulationCache();
    if (cached) {
      applySimulationData(cached);
      setLoadStep("done");
      setFromCache(true);
      setLoading(false);
    } else {
      fetchFresh();
    }
  }, [applySimulationData, fetchFresh]);

  const handleRefresh = () => {
    clearSimulationCache();
    fetchFresh();
  };

  const handleToggle = (id: string) => {
    const sid = id as SelectedScenario;
    setSelected((prev) => (prev === sid ? null : sid));
  };

  if (loading) {
    return (
      <div className="pb-28">
        <CompanyPageHeader title="시뮬레이션" />
        <LoadingCard step={loadStep} />
      </div>
    );
  }

  return (
    <div className="pb-28">
      <CompanyPageHeader title="시뮬레이션" />

      <main className="mt-6 grid gap-8">

        {/* ── AI 시계열 예측 그래프 ───────────────────────── */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="title1 text-[var(--color-black)]">AI 시계열 예측 그래프</h2>
            <button
              type="button"
              onClick={handleRefresh}
              title="새로고침 (최신 데이터로 재계산)"
              className="flex items-center gap-1 caption2 text-[var(--color-grey-450)] hover:text-[var(--color-green)]"
            >
              <RefreshCw size={13} />
              {fromCache && <span>캐시됨</span>}
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <TabButton active={activeTab === "emission"} onClick={() => setActiveTab("emission")}>
              배출량
            </TabButton>
            <TabButton active={activeTab === "cost-benefit"} onClick={() => setActiveTab("cost-benefit")}>
              비용-편익
            </TabButton>
          </div>

          {activeTab === "emission" ? (
            <EmissionChart
              data={chartData}
              selected={selectedScenario}
              modelUsed={modelUsed}
              currentMonthIndex={currentMonthIdx}
            />
          ) : (
            <CostBenefitChart scenarios={scenarioList} />
          )}
        </section>

        {/* ── 탄소 감축 시나리오 ───────────────────────────── */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="title1 text-[var(--color-black)]">탄소 감축 시나리오</h2>
            <span className="caption2 text-[var(--color-grey-550)]">AI 추천 우선순위순</span>
          </div>
          {selectedScenario && (
            <p className="mt-1 caption2 text-[var(--color-green)]">
              시나리오 {selectedScenario} 선택됨 · 다시 누르면 전체 보기
            </p>
          )}

          <div className="mt-3 grid gap-3">
            {scenarioList.map((s) => (
              <ScenarioSummaryCard
                key={s.id}
                scenario={s}
                selected={selectedScenario === s.id}
                onToggle={() => handleToggle(s.id)}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
