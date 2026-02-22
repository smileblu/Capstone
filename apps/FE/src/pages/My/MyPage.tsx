import React, { useState } from "react";
import { ChevronRight, Plus, X } from "lucide-react";

type RouteItem = {
  id: number;
  label: string; // "집 ↔ 학교"
  mode: string; // "지하철"
};

function Row({
  left,
  right,
  onClick,
}: {
  left: string;
  right?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex h-9 w-full items-center justify-between rounded-[12px] border border-[var(--color-grey-350)] bg-white px-4">
      <span className="body1 text-[var(--color-grey-750)]">{left}</span>
      {right ? (
        <span className="body1 text-[var(--color-grey-750)]">{right}</span>
      ) : null}
      <button>
        <ChevronRight className="cursor-pointer h-5 w-5 text-[var(--color-grey-750)]" />
      </button>
    </div>
  );
}

function RouteRow({
  item,
  onClick,
}: {
  item: RouteItem;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-9 w-full grid-cols-[24px_100px_50px_72px_auto] items-center rounded-[12px] border border-[var(--color-grey-350)] text-left bg-white px-4"
    >
      {/* 1) 번호 */}
      <span className="body1 text-[var(--color-grey-750)] text-left">
        {item.id}
      </span>

      {/* 2) 라벨 (길면 ... 처리) */}
      <span className="body1 text-[var(--color-grey-750)] truncate">
        {item.label}
      </span>

      {/* 3) 구분자 */}
      <span className="body1 text-[var(--color-grey-750)] text-center">|</span>

      {/* 4) 모드 */}
      <span className="body1 text-[var(--color-grey-750)] text-left">
        {item.mode}
      </span>

      {/* 5) 화살표 */}
      <ChevronRight className="h-5 w-5 justify-self-end text-[var(--color-grey-750)]" />
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="body1 inline-flex h-9 px-4 transition-all items-center justify-center rounded-[12px] bg-[var(--color-green)] text-[var(--color-white)]">
      {children}
    </div>
  );
}

export default function MyPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([
    { id: 1, label: "집 ↔ 학교", mode: "지하철" },
    { id: 2, label: "집 ↔ 회사", mode: "자동차" },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState("지하철");

  const canSave = label.trim().length > 0;

  const onSave = () => {
    if (!canSave) return;

    setRoutes((prev) => {
      const nextId =
        prev.length > 0 ? Math.max(...prev.map((r) => r.id)) + 1 : 1;

      return [
        ...prev,
        {
          id: nextId,
          label,
          mode,
        },
      ];
    });

    setLabel("");
    setMode("지하철");
    setIsOpen(false);
  };

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-center">
        <div className="h0 text-[var(--color-dark-green)]">마이페이지</div>
      </div>

      {/* Greeting card */}
      <div className="mt-6 rounded-[12px] bg-[#E5ECD6] px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-[var(--color-grey-350)]" />
          <div className="label2 text-[var(--color-grey-900)]">
            김이화 님,
            <br />
            오늘도 작은 실천을 기록해볼까요?
          </div>
        </div>
      </div>

      {/* 내 정보 */}
      <div className="pl-2 title1 mt-6 text-[var(--color-black)]">내 정보</div>
      <div className="mt-1 space-y-2">
        <Row left="이메일" right="abc@email.com" onClick={() => {}} />
        <Row left="비밀번호" right="••••••••••••••••" onClick={() => {}} />
      </div>

      {/* 이동 설정 */}
      <div className="pl-2 title1 mt-7 text-[var(--color-black)]">
        이동 설정
      </div>
      <div className="mt-2">
        <div className="body1 text-[var(--color-grey-900)]">
          자주 이용하는 경로
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {routes.map((r) => (
          <RouteRow key={r.id} item={r} onClick={() => {}} />
        ))}

        {/* 경로 추가 */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="cursor-pointer flex h-9 w-full items-center px-3 gap-2 rounded-[12px] bg-[var(--color-grey-250)] active:scale-[0.99]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-grey-250)] border-[1.5px] border-[var(--color-grey-750)]">
            <Plus className="h-4 w-4 text-[var(--color-grey-750)]" />
          </span>
          <span className="body1 text-[var(--color-grey-750)]">경로 추가</span>
        </button>
      </div>
      {isOpen && (
        <div className="absolute inset-0 z-[60]">
          {/* dim */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="닫기"
          />

          {/* sheet */}
          <div className="absolute bottom-0 left-1/2 w-[402px] -translate-x-1/2 rounded-t-[20px] bg-white px-5 pt-4 pb-6">
            <div className="flex items-center justify-between">
              <div className="title1 text-[var(--color-black)]">경로 추가</div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full active:bg-[var(--color-grey-100)]"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-[var(--color-grey-700)]" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="pl-2 body1 text-[var(--color-grey-550)]">
                  경로 이름
                </div>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="예) 집 ↔ 학교"
                  className="mt-1 body1 h-10 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
                />
              </div>

              <div>
                <div className="pl-2 body1 text-[var(--color-grey-550)]">
                  이동수단
                </div>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="mt-1 body1 h-10 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
                >
                  <option>지하철</option>
                  <option>버스</option>
                  <option>자동차</option>
                  <option>도보</option>
                  <option>자전거</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className={`mt-5 label1 h-12 w-full rounded-[12px] active:scale-[0.99] ${
                canSave
                  ? "bg-[var(--color-green)] text-white"
                  : "bg-[var(--color-grey-150)] text-[var(--color-grey-350)]"
              }`}
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* 평소 이동 스타일 */}
      <div className="mt-6">
        <div className="body1 text-[var(--color-grey-900)]">
          평소 이동 스타일
        </div>
        <div className="mt-3 flex gap-3">
          <Chip>차</Chip>
          <Chip>30분 미만</Chip>
        </div>
      </div>

      {/* 전력 사용 설정 */}
      <div className="title1 mt-7 text-[var(--color-black)]">
        전력 사용 설정
      </div>
      <div className="mt-3">
        <Row left="전기요금" right="3만원 ~ 5만원" onClick={() => {}} />
      </div>

      {/* bottom padding for navbar */}
      <div className="h-6" />
    </div>
  );
}
