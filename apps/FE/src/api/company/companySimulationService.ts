import axiosInstance from "../axiosInstance";

export interface EmissionPoint {
  month: string;
  actual: number | null;
  current: number | null;
  scenarioA: number | null;
  scenarioB: number | null;
  scenarioC: number | null;
}

export interface ActionInfo {
  targetCategory: string;
  actionDesc: string;
  reductionRate: number;
  investmentCostKrw: number;
  paybackMonths: number;
}

export interface ScenarioInfo {
  id: string;                   // "A" | "B" | "C"
  name: string;
  label: string;
  description: string;
  difficulty: string;           // "low" | "medium" | "high"
  recommended: boolean;
  feasibility: number;
  actions: ActionInfo[];
  // 계산된 지표
  co2ReductionKg: number;
  co2ReductionTon: number;
  costSavingKrw: number;
  investmentCostKrw: number;
  paybackMonths: number;
  fiveYearRoiPct: number | null;
  scenarioForecast: number[];   // 미래 6개월 월별 배출량 (tCO₂e)
}

export interface SimulationData {
  modelUsed: string;            // "ARIMA" | "SARIMA" | "linear_fallback"
  points: EmissionPoint[];
  scenarios: ScenarioInfo[];
}

export const getSimulation = () =>
  axiosInstance.get<any, SimulationData>("/company/simulation");
