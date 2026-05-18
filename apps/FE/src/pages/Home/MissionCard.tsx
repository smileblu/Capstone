import { useNavigate } from "react-router-dom";

interface MissionCardProps {
  progress: number;
}

export default function MissionCard({ progress }: MissionCardProps) {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="title1">이번 달 미션</h2>

      <button
        type="button"
        onClick={() => navigate("/personal/reward")}
        className="mt-3 w-full rounded-2xl border border-[var(--color-grey-250)] bg-[var(--color-white)] px-5 py-4 shadow-sm text-left active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="body1 text-[var(--color-grey-750)]">
            {progress}% 완료
          </div>
          <div className="text-[var(--color-grey-550)]">›</div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-[var(--color-grey-250)]">
          <div
            className="h-2 rounded-full bg-[var(--color-green)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>
    </section>
  );
}
