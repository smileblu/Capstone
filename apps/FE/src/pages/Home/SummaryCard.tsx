export default function SummaryCard() {
  return (
    <section>
      <div className="flex items-center gap-2">
        <h2 className="title1 text-[var(--color-black)]">이번 달 요약</h2>
        <span className="text-[var(--color-grey-550)]">▾</span>
      </div>

      <div className="mt-3 rounded-2xl bg-[var(--color-light-green)]/25 px-10 py-3">
        <div className="grid grid-cols-[1fr_auto] gap-y-2">
          <div className="label2 text-[var(--color-black)]">총 탄소 배출량</div>
          <div className="text-[var(--color-black)]">
            <span className="label1">23.4</span>
            <span className="body2 ml-1">kgCO₂</span>
          </div>

          <div className="label2 text-[var(--color-black)]">환산 금액</div>
          <div className="text-[var(--color-dark-green)]">
            <span className="label1">18,200</span> 
            <span className="body2 ml-1 text-[var(--color-black)]">원</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center caption2 text-[var(--color-grey-750)]">
        지난 달 보다 전기 사용이 줄었어요
      </p>
    </section>
  );
}
