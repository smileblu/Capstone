/** 공통 API 응답 구조 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ErrorResponse | null;
}

/** 공통 에러 응답 구조 */
export interface ErrorResponse {
  code: string;
  message: string;
}

/** 이동 수단 타입 */
export type TransportMode = "BUS" | "METRO" | "CAR" | "WALK";

/** 이동 기록 저장 요청 (POST /activities/transport) */
export interface TransportRequest {
  userId: number;
  activityDate: string;
  transportMode: TransportMode | null;
  distanceKm: number | null;
  routeId: string | null; // 온보딩 저장 경로 선택 시 사용
  inputMethod: "manual" | "api" | "ocr";
  routeName?: string;
  origin?: string;
  destination?: string;
}

/** 전기 사용 기록 저장 요청 (POST /activities/electricity) */
export interface ElectricityRequest {
  userId: number;
  activityDate: string;
  billAmount: number;
  usagePattern: "HOME" | "OUT" | "HVAC";
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
}

export type ConsumptionCategory = "DELIVERY" | "OUT_EAT" | "CAFE" | "FASHION" | "ETC";

/** 소비 기록 저장 요청 (POST /activities/consumption) */
export interface ConsumptionRequest {
  userId: number;
  activityDate: string;
  category: ConsumptionCategory;
  count: number;
  inputMethod: "manual" | "api" | "ocr";
  imageUrl?: string; 
}

/** 요약 데이터 개별 항목 타입 */
export interface SummaryItem {
  hasData: boolean;  
  emissionKg: number;
  moneyWon: number;
  kwh?: number;       // 전기
}

/** 오늘 기록 요약 응답 (GET /activities/summary/today) */
export interface SummaryResult {
  transport: SummaryItem;
  consumption: SummaryItem;
  electricity: SummaryItem;
  electricityFromOnboardingDefault: boolean;
  totalEmissionKg: number;  // 전체 합계 필드
  totalMoneyWon: number;    // 전체 합계 필드
}

/** 활동 입력 후 서버로부터 받는 계산 결과 (POST 응답용) */
export interface ActivityResponse {
  emissionKg: number;
  moneyWon: number;
  kwh?: number;      // 전기 전용
  totalEmission?: number; 
}