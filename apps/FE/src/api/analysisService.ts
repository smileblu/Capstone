import axiosInstance from "./axiosInstance";
import type { AnalysisResponse, ScenarioResponse } from "../types/analysis";

export const getAnalysis = () =>
  axiosInstance.get<any, AnalysisResponse>("/analysis");

export const getScenarios = () =>
  axiosInstance.get<any, ScenarioResponse[]>("/analysis/scenarios");
