import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyMissions, completeMission, claimMission } from "../../api/missionService";
import type { MissionResponse } from "../../types/mission";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Filter = "전체" | "미션 전" | "미션 완료";

export default function RewardPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("전체");
  const [missions, setMissions] = useState<MissionResponse[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchMissions = async () => {
    try {
      const data = await getMyMissions();
      setMissions(data ?? []);
    } catch (e) {
      console.error("미션 목록 로드 실패:", e);
    }
  };

  useEffect(() => { fetchMissions(); }, []);

  const filteredMissions = useMemo(() => {
    if (filter === "미션 전") return missions.filter((m) => m.status === "pending");
    if (filter === "미션 완료") return missions.filter((m) => m.status === "done" || m.status === "paid");
    return missions;
  }, [filter, missions]);

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === selectedId) ?? null,
    [missions, selectedId]
  );

  // 총 포인트 (paid 상태 합계)
  const totalPoints = useMemo(
    () => missions.filter((m) => m.status === "paid").reduce((sum, m) => sum + m.points, 0),
    [missions]
  );

  // 총 절감 배출량 (done + paid 합계)
  const totalSavedKg = useMemo(
    () => missions
      .filter((m) => m.status === "done" || m.status === "paid")
      .reduce((sum, m) => sum + m.impactKg, 0),
    [missions]
  );

  const openConfirm = (id: number) => { setSelectedId(id); setIsConfirmOpen(true); };
  const closeConfirm = () => { setSelectedId(null); setIsConfirmOpen(false); };

  const handleConfirm = async () => {
    if (selectedId == null || !selectedMission) return;
    try {
      if (selectedMission.status === "pending") {
        await completeMission(selectedId);
      } else if (selectedMission.status === "done") {
        await claimMission(selectedId);
      }
      await fetchMissions();
    } catch (e) {
      console.error("미션 업데이트 실패:", e);
    } finally {
      closeConfirm();
    }
  };

  const confirmTitle = selectedMission?.status === "done"
    ? "포인트를 수령하시겠습니까?"
    : "미션을 완료하셨습니까?";

  return (
    <div className="relative pb-24">
      {/* 헤더 */}
      <header className="relative flex h-10 items-center justify-center pt-2">
        <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">내 포인트</h1>
        <button
          onClick={() => navigate("/personal/reward/point")}
          className="absolute right-0 flex items-center gap-1.5 px-3 py-1 bg-[var(--color-green)] rounded-full shadow-sm active:scale-95 transition-all"
        >
          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">$</span>
          </div>
          <span className="caption1 font-bold text-white">{totalPoints.toLocaleString()}P</span>
        </button>
      </header>

      {/* 상단 요약 카드 */}
      <div className="mt-5 rounded-2xl p-5 bg-[var(--color-light-green)]/20 mb-3">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="label2 text-[var(--color-grey-950)]">총 절감 탄소 배출량</span>
            <span className="title1 text-[var(--color-grey-950)]">
              {totalSavedKg.toFixed(1)} <span className="body2">kgCO₂</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="label2 text-[var(--color-grey-950)]">획득 포인트</span>
            <span className="title1 text-[var(--color-grey-950)]">
              {totalPoints.toLocaleString()} <span className="body2">P</span>
            </span>
          </div>
        </div>
      </div>

      {/* 미션 리스트 헤더 */}
      <div className="mb-3">
        <h2 className="title1 text-[var(--color-grey-950)]">미션</h2>
        <p className="caption2 text-[var(--color-grey-550)]">
          다양한 미션을 수행하고 포인트를 모아보세요
        </p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-2">
        {(["전체", "미션 전", "미션 완료"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full border transition-all caption1",
              filter === f
                ? "border-[var(--color-green)] bg-[var(--color-light-green)] text-[var(--color-grey-950)] font-bold"
                : "border-[var(--color-grey-250)] bg-white text-[var(--color-grey-550)]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 미션 카드 목록 */}
      <div className="space-y-3">
        {filteredMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onClick={() => {
              if (mission.status === "paid") return;
              openConfirm(mission.id);
            }}
          />
        ))}
        {filteredMissions.length === 0 && (
          <div className="py-10 text-center caption2 text-[var(--color-grey-450)]">
            해당하는 미션이 없습니다.
          </div>
        )}
      </div>

      <ConfirmModal
        open={isConfirmOpen}
        title={confirmTitle}
        subtitle={selectedMission?.title}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
      />
    </div>
  );
}

function MissionCard({ mission, onClick }: { mission: MissionResponse; onClick?: () => void }) {
  const { title, subtitle, points, impactKg, difficulty, status } = mission;

  const statusInfo = {
    pending: { label: `+ ${points} P`, color: "text-[var(--color-green)]" },
    done:    { label: "미션 완료 · 포인트 수령하기", color: "text-[var(--color-green)] font-bold" },
    paid:    { label: "포인트 지급 완료", color: "text-[var(--color-grey-450)]" },
  }[status];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === "paid"}
      className={cn(
        "w-full text-left rounded-2xl p-4 border transition-all",
        status === "paid"
          ? "bg-[var(--color-grey-150)] border-transparent"
          : "bg-white border-[var(--color-grey-250)] shadow-sm active:scale-[0.99]"
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="label1 text-[var(--color-grey-950)]">{title}</h3>
        <span className={cn("label1", statusInfo.color)}>{statusInfo.label}</span>
      </div>
      <p className="body1 text-[var(--color-grey-550)] mb-2">{subtitle}</p>
      <div className="flex justify-between items-end">
        <span className="body1 text-[var(--color-green)] opacity-80">- {impactKg}kgCO₂</span>
        <span className="body2 text-[var(--color-grey-450)]">난이도 {difficulty}</span>
      </div>
    </button>
  );
}

function ConfirmModal({ open, title, subtitle, onConfirm, onClose }: {
  open: boolean; title: string; subtitle?: string; onConfirm: () => void; onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="닫기" />
      <div className="relative w-[calc(100%-48px)] max-w-[340px] rounded-2xl bg-white px-6 py-6 shadow-lg">
        <div className="text-center">
          <div className="title1 text-[var(--color-grey-950)]">{title}</div>
          {subtitle && <div className="caption2 mt-2 text-[var(--color-grey-550)]">{subtitle}</div>}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onConfirm}
            className="h-11 rounded-xl bg-[var(--color-dark-green)] text-white active:opacity-90">
            <span className="label1">네</span>
          </button>
          <button type="button" onClick={onClose}
            className="h-11 rounded-xl bg-[var(--color-grey-350)] text-white active:opacity-90">
            <span className="label1">아니오</span>
          </button>
        </div>
      </div>
    </div>
  );
}
