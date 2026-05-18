import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getMyMissions } from "../../api/missionService";
import type { MissionResponse } from "../../types/mission";

export default function PointHistoryPage() {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<MissionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyMissions()
      .then((data) => setMissions(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // PAID 미션만 포인트 내역으로 표시
  const history = useMemo(
    () => missions.filter((m) => m.status === "paid"),
    [missions]
  );

  const totalPoints = useMemo(
    () => history.reduce((sum, m) => sum + m.points, 0),
    [history]
  );

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
            <div className="h0 text-[var(--color-grey-950)]">
              {loading ? "—" : `${totalPoints.toLocaleString()} P`}
            </div>
            <button className="px-4 py-1 bg-[var(--color-dark-green)] text-white rounded-[12px] body1 active:scale-95 transition-all">
              출금
            </button>
          </div>

          <button className="w-full mt-4 py-3 bg-white/50 rounded-xl border border-[var(--color-grey-250)] caption2 text-[var(--color-grey-700)] hover:bg-white transition-colors">
            리워드 사용 방법 설명
          </button>
        </div>

        {/* 내역 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="caption2 text-[var(--color-grey-550)]">총 {history.length} 건</div>
        </div>

        <div className="h-[1px] bg-[var(--color-grey-950)] w-full" />

        {/* 내역 리스트 */}
        {loading ? (
          <div className="py-10 text-center caption2 text-[var(--color-grey-450)]">불러오는 중...</div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center caption2 text-[var(--color-grey-450)]">
            아직 수령한 포인트가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-grey-250)]">
            {history.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="label1 text-[var(--color-grey-950)] mb-1">{item.title}</div>
                  <div className="body1 text-[var(--color-grey-450)]">{item.updatedAt ?? ""}</div>
                </div>
                <div className="title1 text-[var(--color-light-green)]">
                  + {item.points} P
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
