import type { SimulationData } from "./companySimulationService";

// 캐시 키: 연-월 단위 (월이 바뀌면 자동 만료)
const cacheKey = () => {
  const now = new Date();
  return `sim-cache-${now.getFullYear()}-${now.getMonth() + 1}`;
};

export function getSimulationCache(): SimulationData | null {
  try {
    const raw = sessionStorage.getItem(cacheKey());
    return raw ? (JSON.parse(raw) as SimulationData) : null;
  } catch {
    return null;
  }
}

export function setSimulationCache(data: SimulationData): void {
  try {
    sessionStorage.setItem(cacheKey(), JSON.stringify(data));
  } catch {}
}

export function clearSimulationCache(): void {
  try {
    sessionStorage.removeItem(cacheKey());
  } catch {}
}
