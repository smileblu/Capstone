import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PointHistoryPage() {
  const navigate = useNavigate();

  const historyItems = [
    { id: 1, title: "미션 포인트 (교통)", date: "2025.12.14 00:31", points: "+ 20 P", isBonus: false },
    { id: 2, title: "보너스 포인트", date: "2025.12.12 12:31", points: "+ 10 P", isBonus: true },
  ];

  return (
    <div className="relative pb-24">
      {/* 헤더 */}
      <header className="relative flex h-10 items-center justify-center pt-2 px-5">
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 h-10 w-10 rounded-full hover:bg-[var(--color-grey-150)] flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={24} strokeWidth={2} color="var(--color-grey-750)" />
          </button>
        <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">포인트 적립 내역</h1>
      </header>

      <main className="mt-8">
        {/* 포인트 정보 카드 */}
        <div className="relative rounded-2xl bg-[var(--color-grey-150)] p-5 mb-8">
          <div className="mb-1 label1 text-[var(--color-grey-550)]">내 포인트</div>
          <div className="flex items-center justify-between">
            <div className="h0 text-[var(--color-grey-950)]">1000 P</div>
            <button className="px-4 py-1 bg-[var(--color-dark-green)] text-white rounded-[12px] body1 active:scale-95 transition-all">
              출금
            </button>
          </div>
          
          {/* 리워드 사용 방법 설명 */}
          <button className="w-full mt-4 py-3 bg-white/50 rounded-xl border border-[var(--color-grey-250)] caption2 text-[var(--color-grey-700)] hover:bg-white transition-colors">
            리워드 사용 방법 설명
          </button>
        </div>

        {/* 내역 리스트 */}
        <div className="flex items-center justify-between mb-2">
          <div className="caption2 text-[var(--color-grey-550)]">총 {historyItems.length} 건</div>
          <div className="flex items-center gap-1 caption2 text-[var(--color-grey-550)]">
            2025.12.01 ~ 2025.12.31
            <Calendar size={14} />
          </div>
        </div>

        <div className="h-[1px] bg-[var(--color-grey-950)] w-full" />

        {/* 내역 리스트 */}
        <div className="divide-y divide-[var(--color-grey-250)]">
          {historyItems.map((item) => (
            <div key={item.id} className="py-3 flex justify-between items-center">
              <div>
                <div className="label1 text-[var(--color-grey-950)] mb-1">{item.title}</div>
                <div className="body1 text-[var(--color-grey-450)]">{item.date}</div>
              </div>
              <div className="title1 text-[var(--color-light-green)]">
                {item.points}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}