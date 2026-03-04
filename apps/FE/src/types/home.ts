/** 이번달 요약 데이터 타입 */
export interface MonthlySummary {
  totalEmission: number;
  totalCost: number;
  goalEmission: number;
  progressPercent: number;
}

/** 월별 배출 추이 데이터 타입 */
export interface MonthlyTrend {
  month: string;
  emission: number;
}

/** 카테고리별 배출 비율 데이터 타입 */
export interface CategoryRatio {
  category: "TRANSPORT" | "ELECTRICITY" | "CONSUMPTION";
  emission: number;
}