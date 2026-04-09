import type { TransportMode } from "../types/activity";

/**
 * 길찾기 API는 자동차 기준 duration(초)을 줍니다.
 * 버스/지하철/도보/자전거는 거리·수단 특성에 맞춰 대략적인 소요 시간(분)을 산출합니다.
 */
export function estimateDurationMinutes(params: {
  distanceKm: number;
  /** 카카오 자동차 길찾기 소요 시간(분) */
  carDurationMin: number;
  mode: TransportMode;
}): number {
  const { distanceKm, carDurationMin, mode } = params;
  const d = Math.max(0, distanceKm);

  switch (mode) {
    case "CAR":
      return Math.max(1, Math.round(carDurationMin));
    case "BUS":
      return Math.max(1, Math.round(carDurationMin * 1.15));
    case "METRO":
      // 시내 궤도·환승 등 단순화: 평균 시속 약 32km 가정
      return Math.max(1, Math.round((d / 32) * 60));
    case "WALK":
      return Math.max(1, Math.round((d / 5) * 60));
    case "BIKE":
      return Math.max(1, Math.round((d / 15) * 60));
    default:
      return Math.max(1, Math.round(carDurationMin));
  }
}
