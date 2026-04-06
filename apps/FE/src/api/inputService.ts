import axiosInstance from "./axiosInstance";
import type { 
  TransportRequest, 
  ElectricityRequest, 
  ConsumptionRequest,
  ActivityResponse, // { totalEmission, costKrw }
  SummaryResult     // 오늘 요약 데이터
} from "../types/activity";

/** * 이동 기록 저장 (POST /api/v1/activities/transport)
 */
export const saveTransport = (data: TransportRequest) => 
  axiosInstance.post<any, ActivityResponse>("/activities/transport", data);

/** * 소비 기록 저장 (POST /api/v1/activities/consumption)
 */
export const saveConsumption = (data: ConsumptionRequest) => 
  axiosInstance.post<any, ActivityResponse>("/activities/consumption", data);

/** * 전기 사용 저장 (POST /api/v1/activities/electricity)
 * 명세서 필드명: userId, billAmount, usagePattern, periodStart, periodEnd
 */
export const saveElectricity = (data: ElectricityRequest) => 
  axiosInstance.post<any, ActivityResponse>("/activities/electricity", data);

/** * 오늘 기록 요약 (GET /api/v1/activities/summary/today)
 * 쿼리 파라미터로 userId를 받음
 */
export const getTodaySummary = () =>
  axiosInstance.get<any, SummaryResult>("/activities/summary/today");