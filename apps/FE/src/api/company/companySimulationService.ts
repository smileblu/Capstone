import axiosInstance from "../axiosInstance";

export interface EmissionPoint {
  month: string;
  actual: number | null;
  current: number | null;
  scenarioA: number | null;
  scenarioB: number | null;
  scenarioC: number | null;
}

export interface ScenarioInfo {
  id: string;
  title: string;
  description: string;
  co2ReductionTon: number;
  costSaving: number;
  recommended: boolean;
}

export interface SimulationData {
  points: EmissionPoint[];
  scenarios: ScenarioInfo[];
}

export const getSimulation = () =>
  axiosInstance.get<any, SimulationData>("/company/simulation");
