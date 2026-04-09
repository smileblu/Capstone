import axios from "axios";

/**
 * 카카오 로컬 키워드 장소 검색 (REST 키).
 * `/api/kakao-local` → `dapi.kakao.com` Vite 프록시
 */

const localClient = axios.create({
  baseURL: "/api/kakao-local",
  timeout: 15_000,
});

function restKey(): string {
  const k = import.meta.env.VITE_KAKAO_REST_KEY as string | undefined;
  if (!k?.trim()) {
    throw new Error("VITE_KAKAO_REST_KEY 가 없습니다.");
  }
  return k.trim();
}

export type KeywordPlaceDocument = {
  place_name: string;
  x: string;
  y: string;
};

export async function searchKeywordPlaces(query: string): Promise<KeywordPlaceDocument[]> {
  const q = query.trim();
  if (!q) return [];

  const { data } = await localClient.get<{ documents?: KeywordPlaceDocument[] }>(
    "/v2/local/search/keyword.json",
    {
      params: { query: q, size: 10 },
      headers: { Authorization: `KakaoAK ${restKey()}` },
    }
  );
  return data.documents ?? [];
}
