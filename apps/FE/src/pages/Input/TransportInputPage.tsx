import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTodayRecordStore } from "./store/RecordStore";

type TransportMode = "차" | "버스" | "지하철" | "자전거" | "걷기";
type TimePreset = "30분" | "1시간" | "2시간" | null;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-[40px] rounded-[8px] border label2 transition flex items-center justify-center",
        selected
          ? "border-transparent text-white"
          : "border-[var(--color-grey-250)] text-[var(--color-grey-750)] bg-white hover:bg-[var(--color-grey-50)]",
      )}
      style={{
        backgroundColor: selected
          ? "var(--color-light-green)"
          : "var(--color-white)",
      }}
    >
      {label}
    </button>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-9 title1 text-[var(--color-black)]">{children}</h2>;
}

function Hint({ children }: { children: string }) {
  return (
    <p className="mt-2 caption2" style={{ color: "var(--color-grey-550)" }}>
      {children}
    </p>
  );
}

export default function TransportInputPage() {
  const navigate = useNavigate();

  const setTransport = useTodayRecordStore((s) => s.setTransport);

  const [mode, setMode] = useState<TransportMode>("차");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [timePreset, setTimePreset] = useState<TimePreset>("30분");
  const [timeDirect, setTimeDirect] = useState("");

  const timeText = useMemo(() => {
    if (timeDirect.trim()) return timeDirect.trim();
    if (timePreset) return timePreset;
    return "";
  }, [timeDirect, timePreset]);

  const canSave = useMemo(() => {
    const hasDistance = distanceKm !== null && !Number.isNaN(distanceKm);
    const hasTime = Boolean(timeText);
    return (hasDistance || hasTime) && Boolean(mode);
  }, [distanceKm, timeText, mode]);

  const onSelectMapRoute = () => {
    const next =
      distanceKm === null ? 6.8 : Math.round((distanceKm + 1.2) * 10) / 10;
    setDistanceKm(next);

    setTimePreset(null);
    setTimeDirect("");
  };

  const onSave = () => {
    // 1) 원래 입력 payload
    const payload = { mode, distanceKm, time: timeText || null };
    console.log("transport input:", payload);

    // 2) 탄소/금액을 계산해서 저장
    // 지금은 더미값, 나중에 계산 로직으로 바꾸기
    const transportSummary = {
      co2Kg: 1.4,
      moneyWon: 560,
    };

    // 3) store에 저장
    setTransport(transportSummary);

    // 4) 요약 페이지로 이동
    navigate("/personal/input/summary");
  };

  return (
    <>
      {/* 페이지 타이틀 */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 h-10 w-10 rounded-full hover:bg-[var(--color-grey-150)] flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <ArrowLeft
              size={24}
              strokeWidth={2}
              color="var(--color-grey-750)"
            />
          </button>

          <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">
            교통 입력
          </h1>
        </div>

        <p
          className="mt-2 text-center body2"
          style={{ color: "var(--color-grey-550)" }}
        >
          오늘 이동한 내용을 입력해주세요
        </p>
      </div>

      {/* 이동 수단 */}
      <SectionTitle>이동 수단</SectionTitle>
      <div className="mt-[10px] grid grid-cols-3 gap-3">
        {(["차", "버스", "지하철"] as TransportMode[]).map((m) => (
          <Chip
            key={m}
            label={m}
            selected={mode === m}
            onClick={() => setMode(m)}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {(["자전거", "걷기"] as TransportMode[]).map((m) => (
          <Chip
            key={m}
            label={m}
            selected={mode === m}
            onClick={() => setMode(m)}
          />
        ))}
      </div>

      {/* 이동 거리 */}
      <SectionTitle>이동 거리</SectionTitle>
      <Hint>거리로 입력</Hint>
      <button
        type="button"
        onClick={onSelectMapRoute}
        className="mt-[4px] w-full h-12 rounded-[12px] border px-4 flex items-center transition"
        style={{
          borderColor:
            distanceKm !== null
              ? "var(--color-light-green)"
              : "var(--color-grey-250)",
          backgroundColor: "var(--color-white)",
          // 값이 없을 때는 center, 값이 생기면 space-between으로 유연하게 전환
          justifyContent: distanceKm !== null ? "space-between" : "center",
        }}
      >
        <div className="flex items-center gap-2">
          {/* 아이콘은 항상 표시하되, 선택 전에는 텍스트와 함께 중앙에 위치합니다 */}
          <span className="text-sm" aria-hidden="true">
            📍
          </span>

          <span
            className={cn(
              "body2",
              distanceKm !== null
                ? "text-[var(--color-green)]"
                : "text-[var(--color-grey-450)] underline underline-offset-4", // 선택 전 언더라인 유지
            )}
          >
            지도 기반 경로를 선택하세요
          </span>
        </div>

        {/* 선택 시에만 우측에 거리 표시 */}
        {distanceKm !== null && (
          <span className="body2 text-[var(--color-grey-950)] font-medium">
            총 {distanceKm}km
          </span>
        )}
      </button>

      {/* 시간 입력 */}
      <Hint>시간으로 입력</Hint>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {(["30분", "1시간", "2시간"] as const).map((t) => (
          <Chip
            key={t}
            label={t}
            selected={timePreset === t}
            onClick={() => {
              setTimePreset((prev) => (prev === t ? null : t));
              setTimeDirect("");
              setDistanceKm(null);
            }}
          />
        ))}
      </div>

      {/* 시간 직접 입력 */}
      <div className="mt-3 flex items-center justify-between h-[52px] rounded-[8px] border border-[var(--color-grey-250)] bg-white px-5 transition-all focus-within:border-[var(--color-light-green)]">
        <div className="ml-7 label2 text-[var(--color-grey-950)]">
          시간 직접 입력
        </div>
        <input
          value={timeDirect}
          onChange={(e) => {
            setTimeDirect(e.target.value);
            if (timePreset) setTimePreset(null);
            setDistanceKm(null);
          }}
          placeholder="예: 1시간 30분"
          className="w-[140px] h-[36px] bg-[var(--color-grey-150)] rounded-[6px] px-3 text-center body2 text-[var(--color-grey-950)] outline-none placeholder:text-[var(--color-grey-450)]"
        />
      </div>

      {/* 저장하기 */}
      <div className="pt-20">
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className={cn(
            "h-14 w-full rounded-2xl bg-[var(--color-green)] label1 text-white",
            !canSave && "opacity-50",
          )}
          style={{ backgroundColor: "var(--color-green)" }}
        >
          저장하기
        </button>
      </div>
    </>
  );
}
