export default function MissionCard() {
  const progress = 75; // 나중에 props로 바꿀 수 있음

  return (
    <section>
      <h2 className="title1">이번 달 미션</h2>

      <div className="mt-3 rounded-2xl border border-[var(--color-grey-250)] bg-[var(--color-white)] px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="mx-auto body1 text-[var(--color-grey-750)]">
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
      </div>
    </section>
  );
}
