import axiosInstance from "./axiosInstance";

import type { 
  TransportRequest, 
  TransportResponse,
  ElectricityRequest, 
  ConsumptionRequest 
} from "../types/activity";

/** 이동 기록 저장 */
export const saveTransport = (data: TransportRequest) => 
  axiosInstance.post<any, TransportResponse>("/activities/transport", data);

/** 전기 사용 기록 저장 */
export const saveElectricity = (data: ElectricityRequest) => 
  axiosInstance.post("/activities/electricity", data);

/** 소비 기록 저장 */
export const saveConsumption = (data: ConsumptionRequest) => 
  axiosInstance.post("/activities/consumption", data);