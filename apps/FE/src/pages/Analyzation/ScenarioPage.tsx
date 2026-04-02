import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getScenarios } from "../../api/analysisService";
import { createMissions, getMyMissions } from "../../api/missionService";
import type { ScenarioResponse } from "../../types/analysis";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function ScenarioCard({ item, selected, onToggle, disabledStatus }: {
  item: ScenarioResponse;
  selected: boolean;
  onToggle: () => void;
  disabledStatus?: string;   // "pending" | "done" | "paid" | undefined
}) {
  const impactText = `- ${item.impactKg}kgCO₂${item.impactWon > 0 ? ` | ${item.impactWon.toLocaleString()}원 절약` : ""}`;
  const isDisabled = !!disabledStatus;
  const disabledLabel =
    disabledStatus === "paid" ? "완료됨" :
    disabledStatus === "done" ? "미션 완료" :
    "진행 중";

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onToggle}
      disabled={isDisabled}
      className={cx(
        "w-full rounded-[12px] border px-5 py-[15px] text-left transition-all",
        isDisabled
          ? "border-[var(--color-grey-250)] bg-[var(--color-grey-150)] opacity-50 cursor-not-allowed"
          : selected
            ? "border-[var(--color-green)] bg-[rgba(124,170,72,0.08)] active:scale-[0.99]"
            : "border-[var(--color-grey-250)] bg-white active:scale-[0.99]",
      )}
    >
      <div className="flex flex-col items-start">
        <div className="flex w-full items-center justify-between">
          <div className="label1 text-[var(--color-black)]">{item.title}</div>
          {isDisabled
            ? <span className="caption2 text-[var(--color-grey-450)]">{disabledLabel}</span>
            : <button
                type="button"
                aria-label="선택"
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={cx(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                  selected
                    ? "border-[var(--color-green)] bg-[var(--color-green)]"
                    : "border-[var(--color-grey-350)] bg-white",
                )}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-white" />}
              </button>
          }
        </div>
        <div className="body1 text-[var(--color-grey-550)]">{item.subtitle}</div>
        <div className="mt-1 flex w-full justify-between">
          <div className="body1 text-[var(--color-green)]">{impactText}</div>
          <div className="body2 text-[var(--color-grey-350)]">난이도 {item.difficulty}</div>
        </div>
      </div>
    </button>
  );
}

export default function ScenarioPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // scenarioId → status 맵 (회색 처리 + 라벨용)
  const [missionStatusMap, setMissionStatusMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    getScenarios()
      .then(setScenarios)
      .catch((e) => console.error("시나리오 로드 실패:", e));

    getMyMissions()
      .then((missions) => {
        const map = new Map(missions.map((m) => [m.scenarioId, m.status]));
        setMissionStatusMap(map);
      })
      .catch(() => {});
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const [submitting, setSubmitting] = useState(false);

  const selectedScenarios = useMemo(
    () => scenarios.filter((s) => selectedIds.has(s.id)),
    [scenarios, selectedIds]
  );

  const onMissionStart = async () => {
    if (selectedCount === 0 || submitting) return;
    setSubmitting(true);
    try {
      await createMissions(selectedScenarios);
      navigate("/personal/reward");
    } catch (e) {
      console.error("미션 생성 실패:", e);
      alert("미션 생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="h-6 w-6 text-[var(--color-grey-750)]" />
        </button>
        <div className="flex-1 text-center">
          <div className="h0 text-[var(--color-dark-green)]">탄소 절감 방법</div>
        </div>
        <div className="h-10 w-10" />
      </div>

      <main className="mt-6">
        <div className="title1 text-[var(--color-black)]">탄소 절감 시나리오</div>
        <div className="caption2 text-[var(--color-grey-550)]">
          개인 맞춤 우선 순위 순 (복수 선택 가능)
        </div>

        <div className="mt-3 space-y-3">
          {scenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              item={s}
              selected={selectedIds.has(s.id)}
              onToggle={() => toggleSelect(s.id)}
              disabledStatus={missionStatusMap.get(s.id)}
            />
          ))}
        </div>

        <div className="fixed left-1/2 bottom-[80px] z-40 w-[402px] -translate-x-1/2 px-5">
          <button
            type="button"
            disabled={selectedCount === 0 || submitting}
            onClick={onMissionStart}
            className={cx(
              "label1 h-12 w-full rounded-[8px] transition-all active:scale-[0.99]",
              selectedCount > 0
                ? "bg-[var(--color-green)] text-[var(--color-white)]"
                : "bg-[var(--color-grey-150)] text-[var(--color-grey-350)]",
            )}
          >
            {selectedCount > 0 ? `미션하러 가기 (${selectedCount})` : "시나리오를 선택해주세요"}
          </button>
        </div>

        <div className="h-[120px]" />
      </main>
    </div>
  );
}
