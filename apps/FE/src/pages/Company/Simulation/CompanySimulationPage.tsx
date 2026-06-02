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

/** 감축 단가(원/tCO₂e) → 초록 계열 색상 (낮을수록 진한 초록) */
function unitCostToColor(uc: number, minUc: number, maxUc: number): string {
  if (!isFinite(uc)) return "hsl(50, 40%, 75%)";
  const ratio = maxUc === minUc ? 0 : (uc - minUc) / (maxUc - minUc);
  const step  = ratio * 5;
  return `hsl(${Math.round(100 - step * 10)}, 40%, ${Math.round(55 + step * 4)}%)`;
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
          <YAxis domain={[yMin, yMax]} ticks={ticks} tick={{ fontSize: 11 }} label={{ value: "tCO₂e", angle: -90, position: "insideLeft", offset: 30, fontSize: 10, fill: "#8e8e8e" }} />
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
          <Line type="monotone" dataKey="actual" stroke="#000" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          <Line type="monotone" dataKey="current" stroke="#888" strokeWidth={1.5} strokeDasharray="6 3" dot={false} connectNulls />
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

      {/* 범례 — 2줄: 실측/예측 기준선 | 시나리오 */}
      <div className="mt-3 flex flex-col gap-1.5 px-1">
        <div className="flex gap-4">
          {([
            { label: "실제 배출량", color: "#000",  dash: false },
            { label: "현재 유지",   color: "#888",  dash: true  },
          ] as const).map(({ label, color, dash }) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] text-[#555]">
              <svg width="16" height="10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="16" y2="5" stroke={color} strokeWidth={2}
                  strokeDasharray={dash ? "6 3" : undefined} />
              </svg>
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-4">
          {(["A", "B", "C"] as const).map((id) => (
            <span key={id} className="flex items-center gap-1.5 text-[10px] text-[#555]">
              <svg width="16" height="10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="16" y2="5" stroke={SCENARIO_COLORS[id]}
                  strokeWidth={2} strokeDasharray="6 3" />
              </svg>
              시나리오 {id}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 비용-편익 버블 차트 ────────────────────────────────────────────────────────

const BubbleDot = (props: any) => {
  const { cx, cy, payload } = props;
  const r = Math.sqrt(payload.z) * 0.55;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={0.85} />
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
      <p className="font-bold text-[var(--color-black)] mb-1">{d.label}</p>
      <p className="text-[var(--color-grey-550)]">투자 비용: {fmtKrw(d.x)}만원</p>
      <p className="text-[var(--color-grey-550)]">연간 감축량: {d.annualReduction?.toFixed(1)} tCO₂e/year</p>
      <p className="text-[var(--color-grey-550)]">5년 누적 감축: {d.fiveYearReduction?.toFixed(1)} tCO₂e</p>
      <p className="text-[var(--color-grey-550)]">감축 단가: {d.unitCostWon != null ? `${fmtKrw(d.unitCostWon)}원/tCO₂e` : "-"}</p>
      <p className="text-[var(--color-grey-550)]">회수기간: {paybackStr}</p>
      {roi != null && <p className={roiColor}>5년 ROI: {roi.toFixed(1)}%</p>}
    </div>
  );
};

function CostBenefitChart({ scenarios }: { scenarios: ScenarioInfo[] }) {
  const annualReduction   = (s: ScenarioInfo) => s.co2ReductionTon * 2;
  const fiveYearReduction = (s: ScenarioInfo) => s.co2ReductionTon * 10;
  const unitCost          = (s: ScenarioInfo) => {
    const five = fiveYearReduction(s);
    return five > 0 ? s.investmentCostKrw / five : Infinity;
  };

  const unitCosts = scenarios.map(unitCost);
  const validUcs  = unitCosts.filter(isFinite);
  const minUc     = Math.min(...validUcs);
  const maxUc     = Math.max(...validUcs);

  // z: K-ETS 5년 ROI 점수 → score = max(0, roi + 100)
  const roiScores  = scenarios.map((s) => Math.max(0, (s.fiveYearRoiPct ?? 0) + 100));
  const maxScore   = Math.max(...roiScores, 1);
  const normZ      = (score: number) =>
    Math.round(150 + (score / maxScore) * 2200);

  const bubbleData = scenarios.map((s, i) => ({
    x:                Math.round(s.investmentCostKrw / 10_000),
    y:                Math.round(annualReduction(s) * 10) / 10,
    z:                normZ(roiScores[i]),
    label:            `시나리오 ${s.id}`,
    color:            unitCostToColor(unitCosts[i], minUc, maxUc),
    unitCostWon:      isFinite(unitCosts[i]) ? Math.round(unitCosts[i]) : null,
    annualReduction:  annualReduction(s),
    fiveYearReduction: fiveYearReduction(s),
    paybackMonths:    s.paybackMonths,
    fiveYearRoi:      s.fiveYearRoiPct,
  }));

  const maxX    = Math.max(...bubbleData.map((d) => d.x), 500);
  const minY    = Math.min(...bubbleData.map((d) => d.y));
  const maxY    = Math.max(...bubbleData.map((d) => d.y), 5);
  const domainX = Math.ceil(maxX * 1.4);
  const domainY = Math.ceil(maxY * 1.2);
  const domainYMin = Math.max(0, Math.floor(minY * 0.7));
  const midX    = Math.round(domainX / 2);
  const midY    = Math.round((domainYMin + domainY) / 2);

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-4">
      {/* 범례 */}
      <div className="flex items-center gap-3 mb-1.5 px-1 flex-wrap">
        <span className="text-[10px] text-[var(--color-grey-550)]">점 크기 = K-ETS 5년 ROI</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-[var(--color-grey-450)]">좋음</span>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="h-3 w-3 rounded-full"
              style={{ backgroundColor: `hsl(${100 - i * 10}, 40%, ${55 + i * 4}%)`, opacity: 0.8 }} />
          ))}
          <span className="text-[9px] text-[var(--color-grey-450)]">나쁨</span>
        </div>
      </div>


      <ResponsiveContainer width="100%" height={232}>
        <ScatterChart margin={{ top: 10, right: 40, left: 0, bottom: 20 }}>
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
            name="연간 감축량"
            domain={[domainYMin, domainY]}
            tickFormatter={(v) => `${v}t`}
            tick={{ fontSize: 10 }}
            label={{ value: "연간 감축(tCO₂/yr)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#8e8e8e" }}
          />
          <ZAxis type="number" dataKey="z" range={[600, 2800]} />
          <Tooltip content={<BubbleTooltip />} />
          <ReferenceLine x={midX} stroke="#a8c66c" strokeDasharray="4 3" strokeWidth={1} />
          <ReferenceLine y={midY} stroke="#a8c66c" strokeDasharray="4 3" strokeWidth={1} />
          <Scatter data={bubbleData} shape={<BubbleDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-1 flex justify-start pl-2">
        <span className="text-[10px] text-[var(--color-green)]">← 좌상단: 저비용·고감축 최적 영역</span>
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
    const lastActualIdx = res.points.reduce(
      (acc, p, i) => (p.actual != null ? i : acc), 0
    );
    const mapped: ChartPoint[] = res.points.map((p, i) => {
      const [, m] = p.month.split("-");
      return {
        month:     `${parseInt(m)}월`,
        actual:    p.actual,
        // 저번달(lastActualIdx)까지는 null, 현재달(lastActualIdx)에서 실제값으로 bridge,
        // 이후부터 순수 ARIMA 예측값
        current:   i < lastActualIdx
          ? null
          : i === lastActualIdx
            ? p.actual   // bridge: 실제 배출량 끝점에서 ARIMA 라인 시작
            : p.current,
        scenarioA: p.scenarioA,
        scenarioB: p.scenarioB,
        scenarioC: p.scenarioC,
        isFuture:  p.actual == null && p.current != null,
      };
    });
    setChartData(mapped);
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
