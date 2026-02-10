import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Filter = "전체" | "미션 전" | "미션 완료";

type Mission = {
  id: number;
  title: string;
  description: string;
  points: string;
  reduction: string;
  difficulty: "하" | "중" | "상";
  isCompleted: boolean;
};

export default function RewardPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("전체");

  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 1,
      title: "대중교통 이용 확대",
      description: "주 3일 대중교통 이용",
      points: "20",
      reduction: "-4.5kgCO₂",
      difficulty: "중",
      isCompleted: false,
    },
    {
      id: 2,
      title: "에너지 절약 실천",
      description: "전기 플러그 뽑기",
      points: "15",
      reduction: "-1.2kgCO₂",
      difficulty: "하",
      isCompleted: false,
    },
    {
      id: 3,
      title: "일회용품 줄이기",
      description: "텀블러 사용하기",
      points: "10",
      reduction: "-0.5kgCO₂",
      difficulty: "하",
      isCompleted: true,
    },
  ]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);

  const filteredMissions = useMemo(() => {
    if (filter === "전체") return missions;
    if (filter === "미션 전") return missions.filter((m) => !m.isCompleted);
    if (filter === "미션 완료") return missions.filter((m) => m.isCompleted);
    return missions;
  }, [filter, missions]);

  const openConfirm = (missionId: number) => {
    setSelectedMissionId(missionId);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setSelectedMissionId(null);
  };

  const confirmComplete = () => {
    if (selectedMissionId == null) return;

    setMissions((prev) => {
        const updated = prev.map((m) =>
        m.id === selectedMissionId ? { ...m, isCompleted: true } : m
        );

        return [...updated].sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return a.id - b.id;
        });
    });

    setFilter("전체");
    closeConfirm();
  };

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === selectedMissionId) ?? null,
    [missions, selectedMissionId]
  );

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
          <span className="caption1 font-bold text-white">6430P</span>
        </button>
      </header>

      {/* 상단 요약 카드 */}
      <div className="mt-8 rounded-2xl p-5 bg-[var(--color-light-green)]/20 mb-4">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="label2 text-[var(--color-grey-950)]">총 절감 탄소 배출량</span>
            <span className="title1 text-[var(--color-grey-950)]">
              5.4 <span className="body2">kgCO₂</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="label2 text-[var(--color-grey-950)]">환산 금액</span>
            <span className="title1 text-[var(--color-grey-950)]">
              2000 <span className="body2">원</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="label2 text-[var(--color-grey-950)]">보너스 포인트</span>
            <span className="title1 text-[var(--color-grey-950)]">
              10 <span className="body2">P</span>
            </span>
          </div>
        </div>
      </div>

      <p className="text-center caption2 text-[var(--color-grey-550)] leading-relaxed mb-7 px-6">
        최근 3개월 평균 대비 배출량이 6.2% 감소하여<br />
        보너스 포인트가 지급되었습니다.
      </p>

      {/* 미션 리스트 */}
      <div className="mb-3">
        <h2 className="title1 text-[var(--color-grey-950)]">미션</h2>
        <p className="caption2 text-[var(--color-grey-550)]">
          다양한 미션을 수행하고 포인트를 모아보세요
        </p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-2">
        {(["전체", "미션 전", "미션 완료"] as const).map((f) => {
          const isSelected = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-full border transition-all caption1",
                isSelected
                  ? "border-[var(--color-green)] bg-[var(--color-light-green)] text-[var(--color-grey-950)] font-bold"
                  : "border-[var(--color-grey-250)] bg-white text-[var(--color-grey-550)]"
              )}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* 미션 리스트 */}
      <div className="space-y-3">
        {filteredMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            title={mission.title}
            description={mission.description}
            points={mission.points}
            reduction={mission.reduction}
            difficulty={mission.difficulty}
            isCompleted={mission.isCompleted}
            onClick={() => {
              if (mission.isCompleted) return;
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

      {/* 완료 확인 모달 */}
      <ConfirmModal
        open={isConfirmOpen}
        title="미션을 완료하셨습니까?"
        subtitle={selectedMission ? selectedMission.title : undefined}
        onConfirm={confirmComplete}
        onClose={closeConfirm}
      />
    </div>
  );
}

function MissionCard({
  title,
  description,
  points,
  reduction,
  difficulty,
  isCompleted,
  onClick,
}: {
  title: string;
  description: string;
  points: string;
  reduction: string;
  difficulty: string;
  isCompleted: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl p-4 border transition-all",
        isCompleted
          ? "bg-[var(--color-grey-150)] border-transparent"
          : "bg-white border-[var(--color-grey-250)] shadow-sm active:scale-[0.99]"
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="label1 text-[var(--color-grey-950)]">{title}</h3>
        <span
          className={cn(
            "label1",
            isCompleted ? "text-[var(--color-grey-450)]" : "text-[var(--color-green)]"
          )}
        >
          {isCompleted ? "미션 완료" : `+ ${points} P`}
        </span>
      </div>

      <p className="body1 text-[var(--color-grey-550)] mb-2">{description}</p>

      <div className="flex justify-between items-end">
        <span className="body1 text-[var(--color-green)] opacity-80">{reduction}</span>
        <span className="body2 text-[var(--color-grey-450)]">난이도 {difficulty}</span>
      </div>
    </button>
  );
}

function ConfirmModal({
  open,
  title,
  subtitle,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="닫기"
      />

      {/* 모달 박스 */}
      <div className="relative w-[calc(100%-48px)] max-w-[340px] rounded-2xl bg-white px-6 py-6 shadow-lg">
        <div className="text-center">
          <div className="title1 text-[var(--color-grey-950)]">{title}</div>
          {subtitle ? (
            <div className="caption2 mt-2 text-[var(--color-grey-550)]">{subtitle}</div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {/* 네 */}
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-xl bg-[var(--color-dark-green)] text-white active:opacity-90"
          >
            <span className="label1">네</span>
          </button>

          {/* 아니오 */}
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-[var(--color-grey-350)] text-white active:opacity-90"
          >
            <span className="label1">아니오</span>
          </button>
        </div>
      </div>
    </div>
  );
}