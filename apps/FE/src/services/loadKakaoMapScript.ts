/**
 * 카카오맵 JavaScript SDK 로드 (앱키는 카카오 개발자 콘솔의 JavaScript 키).
 * autoload=false 후 kakao.maps.load 콜백에서 지도를 초기화합니다.
 */

let loadPromise: Promise<void> | null = null;

export function loadKakaoMapScript(): Promise<void> {
  const appKey = (import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY as string | undefined)?.trim();
  if (!appKey) {
    return Promise.reject(
      new Error("VITE_KAKAO_JAVASCRIPT_KEY 가 없습니다. apps/FE/.env 를 확인하세요.")
    );
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("window 가 없습니다."));
  }

  const w = window as Window & { kakao?: { maps?: { load: (cb: () => void) => void } } };
  if (w.kakao?.maps) {
    return new Promise((resolve) => {
      w.kakao!.maps!.load(() => resolve());
    });
  }

  if (!loadPromise) {
    loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
        appKey
      )}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("카카오맵 스크립트 로드에 실패했습니다."));
      document.head.appendChild(script);
    });
  }

  return loadPromise.then(
    () =>
      new Promise<void>((resolve, reject) => {
        const w2 = window as Window & { kakao?: { maps?: { load: (cb: () => void) => void } } };
        if (!w2.kakao?.maps?.load) {
          reject(new Error("kakao.maps 를 찾을 수 없습니다."));
          return;
        }
        w2.kakao.maps.load(() => resolve());
      })
  );
}
