import axios from "axios";

/**
 * 카카오모빌리티 자동차 길찾기 API (REST 키 필요).
 * 브라우저 CORS를 피하기 위해 Vite에서 `/api/kakao-navi` → `apis-navi.kakaomobility.com` 프록시를 사용합니다.
 *
 * @see https://developers.kakaomobility.com/guide/navi-api/directions.html
 */

const naviClient = axios.create({
  baseURL: "/api/kakao-navi",
  timeout: 20_000,
});

function restKey(): string {
  const k = import.meta.env.VITE_KAKAO_REST_KEY as string | undefined;
  if (!k?.trim()) {
    throw new Error(
      "VITE_KAKAO_REST_KEY 가 설정되지 않았습니다. apps/FE/.env 에 카카오 REST API 키를 넣어 주세요."
    );
  }
  return k.trim();
}

/** 카카오 Navi 응답 — sections.roads.vertexes 로 경로선을 그립니다 */
export type KakaoNaviRoute = {
  result_code: number;
  result_msg: string;
  summary?: {
    distance: number;
    duration: number;
  };
  sections?: Array<{
    roads?: Array<{
      vertexes?: number[];
    }>;
  }>;
};

export type KakaoNaviDirectionsResult = {
  routes: KakaoNaviRoute[];
};

/**
 * 출발/도착 좌표로 자동차 추천 경로를 조회합니다.
 * origin/destination 형식: "경도,위도" (Kakao 문서 기준 X,Y)
 */
export async function fetchCarDirections(params: {
  startLng: number;
  startLat: number;
  endLng: number;
  endLat: number;
}): Promise<{
  distanceM: number;
  durationSec: number;
  route: KakaoNaviRoute;
  pathLngLat: { lng: number; lat: number }[];
}> {
  const { startLng, startLat, endLng, endLat } = params;
  const origin = `${startLng},${startLat}`;
  const destination = `${endLng},${endLat}`;

  const { data } = await naviClient.get<KakaoNaviDirectionsResult>("/v1/directions", {
    params: {
      origin,
      destination,
      priority: "RECOMMEND",
      summary: false,
      road_details: false,
    },
    headers: {
      Authorization: `KakaoAK ${restKey()}`,
    },
  });

  const route = data.routes?.[0];
  if (!route || route.result_code !== 0) {
    const msg = route?.result_msg ?? "길찾기에 실패했습니다.";
    throw new Error(msg);
  }

  const dist = route.summary?.distance;
  const dur = route.summary?.duration;
  if (dist == null || dur == null) {
    throw new Error("길찾기 응답에 거리/시간이 없습니다.");
  }

  const pathLngLat = buildPathFromVertexes(route);

  return {
    distanceM: dist,
    durationSec: dur,
    route,
    pathLngLat,
  };
}

/**
 * roads[].vertexes 는 [lng, lat, lng, lat, ...] 1차원 배열
 */
export function buildPathFromVertexes(route: KakaoNaviRoute): { lng: number; lat: number }[] {
  const out: { lng: number; lat: number }[] = [];
  for (const sec of route.sections ?? []) {
    for (const road of sec.roads ?? []) {
      const v = road.vertexes;
      if (!v?.length) continue;
      for (let i = 0; i < v.length - 1; i += 2) {
        out.push({ lng: v[i], lat: v[i + 1] });
      }
    }
  }
  return out;
}

/** 길찾기 실패 시 사용자 메시지 */
export function getKakaoDirectionsErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    const data = e.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (status === 401 || status === 403) {
      return "카카오 REST API 키가 유효하지 않거나 길찾기 권한이 없습니다.";
    }
    if (status) return `길찾기 요청 오류 (HTTP ${status})`;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}
