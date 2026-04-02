import axiosInstance from "./axiosInstance";
import type { MissionResponse } from "../types/mission";
import type { ScenarioResponse } from "../types/analysis";

export const createMissions = (scenarios: ScenarioResponse[]) =>
  axiosInstance.post<any, null>("/missions", { scenarios });

export const getMyMissions = () =>
  axiosInstance.get<any, MissionResponse[]>("/missions");

export const completeMission = (id: number) =>
  axiosInstance.patch<any, null>(`/missions/${id}/complete`);

export const claimMission = (id: number) =>
  axiosInstance.patch<any, null>(`/missions/${id}/claim`);
