export interface WeeklyTrendPoint {
  week: string;
  actual: number | null;
  forecast: number | null;
  target: number | null;
}

export interface CategoryComparison {
  name: string;
  prevWeek: number;
  currWeek: number;
}

export interface AnalysisResponse {
  improvementRate: number;
  warningCount: number;
  weeklyTrend: WeeklyTrendPoint[];
  categoryComparison: CategoryComparison[];
}

export interface ScenarioResponse {
  id: string;
  title: string;
  subtitle: string;
  impactKg: number;
  impactWon: number;
  difficulty: "하" | "중" | "상";
}
