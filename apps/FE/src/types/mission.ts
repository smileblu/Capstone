export interface MissionResponse {
  id: number;
  scenarioId: string;
  title: string;
  subtitle: string;
  impactKg: number;
  impactWon: number;
  difficulty: "하" | "중" | "상";
  points: number;
  status: "pending" | "done" | "paid";
  updatedAt?: string;  // "YYYY.MM.DD HH:mm"
}
