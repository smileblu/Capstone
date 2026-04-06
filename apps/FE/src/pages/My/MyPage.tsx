import React, { useEffect, useState } from "react";
import { ChevronRight, Plus, X } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

type RouteItem = { routeId: number; routeName: string; defaultMode: string };

type MyPageData = {
  name: string;
  email: string;
  routes: RouteItem[];
  mainTransport: string | null;
  dailyTravelTimeBand: string | null;
  electricityBill: number | null;
};

const MODE_LABEL: Record<string, string> = {
  CAR: "자동차", BUS: "버스", SUBWAY: "지하철", WALK: "도보", BIKE: "자전거",
};
const MODE_OPTIONS = ["지하철", "버스", "자동차", "도보", "자전거"];
const MODE_CODE: Record<string, string> = {
  지하철: "SUBWAY", 버스: "BUS", 자동차: "CAR", 도보: "WALK", 자전거: "BIKE",
};
const TRANSPORT_LABEL: Record<string, string> = {
  CAR: "차", BUS: "버스·대중교통", SUBWAY: "지하철", WALK: "도보·자전거", BIKE: "자전거",
};
const TIME_LABEL: Record<string, string> = {
  lt30: "30분 미만", "30to60": "30분 ~ 1시간",
  "60to120": "1시간 ~ 2시간", gt120: "2시간 이상",
};
function elecLabel(bill: number | null) {
  if (!bill) return "설정 안 됨";
  if (bill < 30000) return "3만원 미만";
  if (bill < 50000) return "3만원 ~ 5만원";
  if (bill < 100000) return "5만원 ~ 10만원";
  return "10만원 이상";
}

function Row({ left, right }: { left: string; right?: string }) {
  return (
    <div className="flex h-9 w-full items-center justify-between rounded-[12px] border border-[var(--color-grey-350)] bg-white px-4">
      <span className="body1 text-[var(--color-grey-750)]">{left}</span>
      <span className="body1 text-[var(--color-grey-750)]">{right ?? ""}</span>
    </div>
  );
}

function RouteRow({ item, onDelete }: { item: RouteItem; onDelete: () => void }) {
  return (
    <div className="grid h-9 w-full grid-cols-[1fr_60px_28px] items-center rounded-[12px] border border-[var(--color-grey-350)] bg-white px-4 gap-2">
      <span className="body1 text-[var(--color-grey-750)] truncate">{item.routeName}</span>
      <span className="body1 text-[var(--color-grey-550)] text-right">{MODE_LABEL[item.defaultMode] ?? item.defaultMode}</span>
      <button type="button" onClick={onDelete} className="flex items-center justify-center" aria-label="삭제">
        <X className="h-4 w-4 text-[var(--color-grey-450)]" />
      </button>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="body1 inline-flex h-9 px-4 items-center justify-center rounded-[12px] bg-[var(--color-green)] text-[var(--color-white)]">
      {children}
    </div>
  );
}

export default function MyPage() {
  const [data, setData] = useState<MyPageData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState("지하철");
  const [saving, setSaving] = useState(false);

  const fetchMyPage = async () => {
    try {
      const res = await axiosInstance.get<any, MyPageData>("/mypage");
      setData(res);
    } catch (e) {
      console.error("마이페이지 로드 실패:", e);
    }
  };

  useEffect(() => { fetchMyPage(); }, []);

  const onSave = async () => {
    if (!label.trim() || saving) return;
    setSaving(true);
    try {
      await axiosInstance.post("/mypage/routes", {
        routeName: label.trim(),
        defaultMode: MODE_CODE[mode] ?? "SUBWAY",
      });
      setLabel("");
      setMode("지하철");
      setIsOpen(false);
      await fetchMyPage();
    } catch (e) {
      alert("경로 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (routeId: number) => {
    try {
      await axiosInstance.delete(`/mypage/routes/${routeId}`);
      await fetchMyPage();
    } catch (e) {
      alert("경로 삭제에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center">
        <div className="h0 text-[var(--color-dark-green)]">마이페이지</div>
      </div>

      {/* 인사 카드 */}
      <div className="mt-6 rounded-[12px] bg-[#E5ECD6] px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-[var(--color-grey-350)]" />
          <div className="label2 text-[var(--color-grey-900)]">
            {data?.name ?? "..."} 님,<br />오늘도 작은 실천을 기록해볼까요?
          </div>
        </div>
      </div>

      {/* 내 정보 */}
      <div className="pl-2 title1 mt-6 text-[var(--color-black)]">내 정보</div>
      <div className="mt-1 space-y-2">
        <Row left="이메일" right={data?.email ?? "-"} />
        <Row left="비밀번호" right="••••••••••••••••" />
      </div>

      {/* 이동 설정 */}
      <div className="pl-2 title1 mt-7 text-[var(--color-black)]">이동 설정</div>
      <div className="mt-2">
        <div className="body1 text-[var(--color-grey-900)]">자주 이용하는 경로</div>
      </div>

      <div className="mt-3 space-y-3">
        {(data?.routes ?? []).map((r) => (
          <RouteRow key={r.routeId} item={r} onDelete={() => onDelete(r.routeId)} />
        ))}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="cursor-pointer flex h-9 w-full items-center px-3 gap-2 rounded-[12px] bg-[var(--color-grey-250)] active:scale-[0.99]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-[var(--color-grey-750)]">
            <Plus className="h-4 w-4 text-[var(--color-grey-750)]" />
          </span>
          <span className="body1 text-[var(--color-grey-750)]">경로 추가</span>
        </button>
      </div>

      {/* 평소 이동 스타일 */}
      <div className="mt-6">
        <div className="body1 text-[var(--color-grey-900)]">평소 이동 스타일</div>
        <div className="mt-3 flex gap-3 flex-wrap">
          {data?.mainTransport && <Chip>{TRANSPORT_LABEL[data.mainTransport] ?? data.mainTransport}</Chip>}
          {data?.dailyTravelTimeBand && <Chip>{TIME_LABEL[data.dailyTravelTimeBand] ?? data.dailyTravelTimeBand}</Chip>}
          {!data?.mainTransport && !data?.dailyTravelTimeBand && (
            <span className="body1 text-[var(--color-grey-450)]">설정 안 됨</span>
          )}
        </div>
      </div>

      {/* 전력 사용 설정 */}
      <div className="title1 mt-7 text-[var(--color-black)]">전력 사용 설정</div>
      <div className="mt-3">
        <Row left="전기요금" right={elecLabel(data?.electricityBill ?? null)} />
      </div>

      <div className="h-6" />

      {/* 경로 추가 모달 */}
      {isOpen && (
        <div className="absolute inset-0 z-[60]">
          <button type="button" onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40" aria-label="닫기" />

          <div className="absolute bottom-0 left-1/2 w-[402px] -translate-x-1/2 rounded-t-[20px] bg-white px-5 pt-4 pb-6">
            <div className="flex items-center justify-between">
              <div className="title1 text-[var(--color-black)]">경로 추가</div>
              <button type="button" onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full active:bg-[var(--color-grey-100)]"
                aria-label="닫기">
                <X className="h-5 w-5 text-[var(--color-grey-700)]" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="pl-2 body1 text-[var(--color-grey-550)]">경로 이름</div>
                <input value={label} onChange={(e) => setLabel(e.target.value)}
                  placeholder="예) 집 ↔ 학교"
                  className="mt-1 body1 h-10 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none" />
              </div>
              <div>
                <div className="pl-2 body1 text-[var(--color-grey-550)]">이동수단</div>
                <select value={mode} onChange={(e) => setMode(e.target.value)}
                  className="mt-1 body1 h-10 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none">
                  {MODE_OPTIONS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <button type="button" onClick={onSave} disabled={!label.trim() || saving}
              className={`mt-5 label1 h-12 w-full rounded-[12px] active:scale-[0.99] ${
                label.trim() && !saving
                  ? "bg-[var(--color-green)] text-white"
                  : "bg-[var(--color-grey-150)] text-[var(--color-grey-350)]"
              }`}>
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
