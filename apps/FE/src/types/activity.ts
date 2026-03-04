/** 이동 수단 타입 */
export type TransportMode = "BUS" | "METRO" | "CAR" | "WALK";

/** 이동 기록 저장 요청 (POST /activities/transport) */
export interface TransportRequest {
  activityDate: string;        // YYYY-MM-DD
  transportMode: TransportMode;
  distanceKm: number;
  routeName?: string;          // 예: "집-학교"
  origin?: string;
  destination?: string;
  inputMethod: "manual" | "api" | "ocr";
}

export interface TransportResponse {
  totalEmission: number; // DB: total_emission
  costKrw: number;       // DB: cost_krw
}

/** 전기 사용 기록 저장 요청 (POST /activities/electricity) */
export interface ElectricityRequest {
  activityDate: string;
  billAmount: number;          // 요금 (Service에서 kwh로 환산)
  usagePattern: string;        // 예: "재택", "외출"
  periodStart: string;
  periodEnd: string;
}

/** 소비 기록 저장 요청 (POST /activities/consumption) */
export interface ConsumptionRequest {
  activityDate: string;
  category: string;            // 예: "DELIVERY", "MEAT"
  count: number;
  isOcr: boolean;
  receiptImageUrl?: string;    // S3 업로드 URL
}