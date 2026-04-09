import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search, X } from "lucide-react";
import { loadKakaoMapScript } from "../../services/loadKakaoMapScript";
import { fetchCarDirections, getKakaoDirectionsErrorMessage } from "../../services/kakaoDirectionsService";
import { searchKeywordPlaces, type KeywordPlaceDocument } from "../../services/kakaoLocalSearchService";

export type MapRouteConfirmPayload = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distanceKm: number;
  /** 카카오 자동차 길찾기 기준 소요 시간(분) */
  durationMinCar: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: MapRouteConfirmPayload) => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * 지도에서 출발지(첫 클릭) → 도착지(둘째 클릭) 선택 후 자동차 길찾기로 거리·경로를 구합니다.
 * 둘 다 선택된 뒤 지도를 다시 클릭하면 출발지부터 다시 고릅니다.
 */
export default function MapRoutePicker({ open, onClose, onConfirm }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  /** 클릭 로직에서 최신 출발/도착을 참조 (리스너 클로저 stale 방지) */
  const startRef = useRef<{ lat: number; lng: number } | null>(null);
  const endRef = useRef<{ lat: number; lng: number } | null>(null);

  const [start, setStart] = useState<{ lat: number; lng: number } | null>(null);
  const [end, setEnd] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMinCar, setDurationMinCar] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState<KeywordPlaceDocument[]>([]);
  const [searching, setSearching] = useState(false);

  const clearOverlays = useCallback(() => {
    const maps = (window as unknown as { kakao?: { maps: any } }).kakao?.maps;
    if (!maps) return;
    startMarkerRef.current?.setMap(null);
    endMarkerRef.current?.setMap(null);
    polylineRef.current?.setMap(null);
    startMarkerRef.current = null;
    endMarkerRef.current = null;
    polylineRef.current = null;
  }, []);

  const drawRoute = useCallback(
    async (s: { lat: number; lng: number }, e: { lat: number; lng: number }) => {
      const maps = (window as unknown as { kakao?: { maps: any } }).kakao?.maps;
      const map = mapRef.current;
      if (!maps || !map) return;

      setLoadingRoute(true);
      setError(null);
      try {
        const result = await fetchCarDirections({
          startLng: s.lng,
          startLat: s.lat,
          endLng: e.lng,
          endLat: e.lat,
        });

        const km = Math.round((result.distanceM / 1000) * 100) / 100;
        const carMin = Math.max(1, Math.round(result.durationSec / 60));
        setDistanceKm(km);
        setDurationMinCar(carMin);

        polylineRef.current?.setMap(null);

        let pathPoints = result.pathLngLat;
        if (pathPoints.length < 2) {
          pathPoints = [
            { lng: s.lng, lat: s.lat },
            { lng: e.lng, lat: e.lat },
          ];
        }

        const linePath = pathPoints.map((p) => new maps.LatLng(p.lat, p.lng));
        const polyline = new maps.Polyline({
          path: linePath,
          strokeWeight: 5,
          strokeColor: "#22c55e",
          strokeOpacity: 0.95,
          strokeStyle: "solid",
        });
        polyline.setMap(map);
        polylineRef.current = polyline;

        const bounds = new maps.LatLngBounds();
        linePath.forEach((ll: unknown) => bounds.extend(ll as any));
        map.setBounds(bounds);
      } catch (err) {
        setError(getKakaoDirectionsErrorMessage(err));
        setDistanceKm(null);
        setDurationMinCar(null);
      } finally {
        setLoadingRoute(false);
      }
    },
    []
  );

  const resetRouteState = useCallback(() => {
    startRef.current = null;
    endRef.current = null;
    setStart(null);
    setEnd(null);
    setDistanceKm(null);
    setDurationMinCar(null);
    clearOverlays();
  }, [clearOverlays]);

  /** 모달 열릴 때 상태 초기화 */
  useEffect(() => {
    if (open) {
      resetRouteState();
      setError(null);
      setSearchHits([]);
      setSearchQ("");
    }
  }, [open, resetRouteState]);

  /** 지도 초기화 + 클릭으로 출발/도착 */
  useEffect(() => {
    if (!open || !mapDivRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        await loadKakaoMapScript();
        if (cancelled || !mapDivRef.current) return;

        const maps = (window as unknown as { kakao: { maps: any } }).kakao.maps;
        const center = new maps.LatLng(37.5665, 126.978);
        const map = new maps.Map(mapDivRef.current, {
          center,
          level: 6,
        });
        mapRef.current = map;

        maps.event.addListener(map, "click", (mouseEvent: { latLng: { getLat: () => number; getLng: () => number } }) => {
          const lat = mouseEvent.latLng.getLat();
          const lng = mouseEvent.latLng.getLng();
          const pos = { lat, lng };

          setError(null);

          // 출발·도착 모두 있으면 → 새 출발지로 리셋
          if (startRef.current && endRef.current) {
            clearOverlays();
            startRef.current = pos;
            endRef.current = null;
            setStart(pos);
            setEnd(null);
            setDistanceKm(null);
            setDurationMinCar(null);
            const m = new maps.Marker({ position: new maps.LatLng(lat, lng), map });
            startMarkerRef.current = m;
            return;
          }

          // 출발만 없음 → 출발지
          if (!startRef.current) {
            startRef.current = pos;
            setStart(pos);
            const m = new maps.Marker({ position: new maps.LatLng(lat, lng), map });
            startMarkerRef.current = m;
            return;
          }

          // 도착지
          endRef.current = pos;
          setEnd(pos);
          const m = new maps.Marker({ position: new maps.LatLng(lat, lng), map });
          endMarkerRef.current = m;
          void drawRoute(startRef.current, pos);
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      clearOverlays();
      mapRef.current = null;
      startRef.current = null;
      endRef.current = null;
    };
  }, [open, clearOverlays, drawRoute]);

  const onSearch = async () => {
    setSearching(true);
    setError(null);
    try {
      const docs = await searchKeywordPlaces(searchQ);
      setSearchHits(docs);
      if (docs.length === 0) setError("검색 결과가 없습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSearchHits([]);
    } finally {
      setSearching(false);
    }
  };

  const onPickSearch = (doc: KeywordPlaceDocument) => {
    const maps = (window as unknown as { kakao?: { maps: any } }).kakao?.maps;
    const map = mapRef.current;
    if (!maps || !map) return;

    const lat = Number(doc.y);
    const lng = Number(doc.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const pos = { lat, lng };
    map.setCenter(new maps.LatLng(lat, lng));
    map.setLevel(4);
    setSearchHits([]);

    // 검색 결과를 출발지로 설정 (도착은 지도에서 클릭)
    clearOverlays();
    startRef.current = pos;
    endRef.current = null;
    setStart(pos);
    setEnd(null);
    setDistanceKm(null);
    setDurationMinCar(null);
    const m = new maps.Marker({ position: new maps.LatLng(lat, lng), map });
    startMarkerRef.current = m;
  };

  const onCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const maps = (window as unknown as { kakao?: { maps: any } }).kakao?.maps;
        const map = mapRef.current;
        if (!maps || !map) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map.setCenter(new maps.LatLng(lat, lng));
        map.setLevel(4);
      },
      () => setError("현재 위치를 가져오지 못했습니다. 위치 권한을 허용해 주세요."),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const canConfirm = Boolean(start && end && distanceKm != null && durationMinCar != null && !loadingRoute);

  const handleConfirm = () => {
    if (!start || !end || distanceKm == null || durationMinCar == null) return;
    onConfirm({
      startLat: start.lat,
      startLng: start.lng,
      endLat: end.lat,
      endLng: end.lng,
      distanceKm,
      durationMinCar,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="relative z-[81] w-full max-w-[402px] max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="title1 text-[var(--color-black)]">지도로 경로 선택</h2>
            <p className="mt-1 caption2 text-[var(--color-grey-550)]">
              지도를 한 번 누르면 출발, 두 번째는 도착입니다. 검색으로 출발지를 먼저 잡을 수도 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 hover:bg-[var(--color-grey-150)]"
            aria-label="닫기"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--color-grey-250)] bg-[var(--color-grey-150)] px-3">
            <Search size={18} className="shrink-0 text-[var(--color-grey-450)]" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void onSearch()}
              placeholder="장소 검색 (예: 홍대입구역)"
              className="h-11 min-w-0 flex-1 bg-transparent body2 outline-none"
            />
          </div>
          <button
            type="button"
            disabled={searching}
            onClick={() => void onSearch()}
            className="shrink-0 rounded-xl bg-[var(--color-green)] px-4 py-2 label2 text-white disabled:opacity-60"
          >
            검색
          </button>
        </div>

        {searchHits.length > 0 && (
          <ul className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-[var(--color-grey-250)] bg-white">
            {searchHits.map((h) => (
              <li key={`${h.place_name}-${h.x}-${h.y}`}>
                <button
                  type="button"
                  onClick={() => onPickSearch(h)}
                  className="flex w-full px-3 py-2 text-left body2 hover:bg-[var(--color-grey-150)]"
                >
                  {h.place_name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCurrentLocation}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-2 label2 text-[var(--color-grey-800)]"
          >
            <Navigation size={16} />
            현재 위치로 이동
          </button>
          <button
            type="button"
            onClick={() => {
              resetRouteState();
              setError(null);
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-grey-250)] bg-white px-3 py-2 label2 text-[var(--color-grey-800)]"
          >
            <MapPin size={16} />
            선택 초기화
          </button>
        </div>

        <div
          ref={mapDivRef}
          className="mt-3 h-[min(52vh,320px)] w-full overflow-hidden rounded-xl border border-[var(--color-grey-250)] bg-[var(--color-grey-150)]"
        />

        {loadingRoute && (
          <p className="mt-2 caption2 text-[var(--color-grey-550)]">경로를 불러오는 중…</p>
        )}

        {error && (
          <p className="mt-2 caption2 text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 rounded-xl bg-[var(--color-grey-150)] p-3">
          <div className="flex justify-between body2 text-[var(--color-grey-750)]">
            <span>출발</span>
            <span className="text-[var(--color-grey-950)]">
              {start ? `${start.lat.toFixed(5)}, ${start.lng.toFixed(5)}` : "미선택"}
            </span>
          </div>
          <div className="mt-2 flex justify-between body2 text-[var(--color-grey-750)]">
            <span>도착</span>
            <span className="text-[var(--color-grey-950)]">
              {end ? `${end.lat.toFixed(5)}, ${end.lng.toFixed(5)}` : "미선택"}
            </span>
          </div>
          <div className="mt-2 flex justify-between label1 text-[var(--color-black)]">
            <span>거리 (자동차 도로 기준)</span>
            <span>{distanceKm != null ? `${distanceKm} km` : "—"}</span>
          </div>
          <div className="mt-1 flex justify-between body2 text-[var(--color-grey-750)]">
            <span>자동차 길찾기 소요</span>
            <span>{durationMinCar != null ? `약 ${durationMinCar}분` : "—"}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl border border-[var(--color-grey-250)] label1 text-[var(--color-grey-800)]"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={cn(
              "h-12 flex-1 rounded-2xl label1 text-white",
              !canConfirm ? "bg-[var(--color-pale-green)]" : "bg-[var(--color-green)]"
            )}
          >
            이 경로 사용
          </button>
        </div>
      </div>
    </div>
  );
}
