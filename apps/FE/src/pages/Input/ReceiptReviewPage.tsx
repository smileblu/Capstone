import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTodayRecordStore } from "./store/RecordStore";

type Category = "배달 음식" | "외식" | "카페·음료" | "의류·패션" | "기타";
type Item = { name: string; qty: number; price: number };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: Category;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-[40px] rounded-[8px] border label2 transition flex items-center justify-center",
        selected
          ? "border-transparent text-white"
          : "border-[var(--color-grey-250)] text-[var(--color-grey-750)] bg-white hover:bg-[var(--color-grey-50)]"
      )}
      style={{ backgroundColor: selected ? "var(--color-light-green)" : "var(--color-white)" }}
    >
      {label}
    </button>
  );
}

function numberOnly(text: string) {
  return text.replace(/[^\d]/g, "");
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-9 title1 text-[var(--color-black)]">{children}</h2>;
}

export default function ReceiptReviewPage() {
  const navigate = useNavigate();

  const setConsumption = useTodayRecordStore((s) => s.setConsumption);

  const { state } = useLocation() as {
    state?: {
      imageUrl?: string | null;
      ocr?: {
        storeName?: string;
        date?: string;
        totalAmount?: number;
        items?: Item[];
        category?: Category;
        confidence?: number;
      };
    };
  };

  const initial = state?.ocr ?? {
    storeName: "미확인",
    date: "",
    totalAmount: 0,
    items: [],
    category: "기타" as Category,
    confidence: 0,
  };

  const [storeName] = useState(initial.storeName ?? "미확인");
  const [date] = useState(initial.date ?? "");
  const [totalAmount, setTotalAmount] = useState<number>(initial.totalAmount ?? 0);
  const [category, setCategory] = useState<Category>(initial.category ?? "기타");
  const [items, setItems] = useState<Item[]>(initial.items ?? []);

  const canSave = useMemo(() => totalAmount > 0 && items.length > 0, [totalAmount, items.length]);

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", qty: 1, price: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const onSave = () => {
    const payload = {
        source: "receipt",
        storeName,
        date,
        totalAmount,
        category,
        items,
    };
    console.log("receipt review input:", payload);

    // 나중에 실제 계산은 (총액, 카테고리, 품목) 기반으로 추정
    const consumptionSummary = {
        co2Kg: 0.9,
        moneyWon: 360,
    };

    setConsumption(consumptionSummary);
    navigate("/personal/input/summary");
  };

  return (
    <>
      {/* 타이틀 */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={24} strokeWidth={1.5} color="var(--color-grey-750)" />
          </button>
          <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">인식 결과 확인</h1>
        </div>
        <p className="mt-2 text-center body2 text-[var(--color-grey-550)]">
          결과를 확인하고 필요하면 수정해주세요
        </p>
      </div>

      {/* 이미지 미리보기 */}
      <div className="mt-6">
        {state?.imageUrl ? (
          <img
            src={state.imageUrl}
            alt="영수증"
            className="w-full rounded-2xl border object-cover max-h-[240px]"
            style={{ borderColor: "var(--color-grey-250)" }}
          />
        ) : (
          <div
            className="w-full h-36 rounded-2xl border flex items-center justify-center text-sm"
            style={{ borderColor: "var(--color-grey-250)", color: "var(--color-grey-450)" }}
          >
            영수증 이미지 없음
          </div>
        )}
      </div>

      {/* 기본 정보 */}
      <div className="mt-6 rounded-2xl p-4 bg-[var(--color-grey-150)]">
        <div className="flex items-center justify-between">
          <div className="body2 text-[var(--color-grey-750)]">상호</div>
          <div className="label1 text-[var(--color-grey-950)]">{storeName}</div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="body2 text-[var(--color-grey-750)]">날짜</div>
          <div className="label1 text-[var(--color-grey-950)]">{date || "미확인"}</div>
        </div>

        <div className="mt-4">
          <div className="body2 text-[var(--color-grey-750)] mb-2">총액(원)</div>
          <input
            value={totalAmount.toLocaleString()}
            onChange={(e) => {
              const n = Number(numberOnly(e.target.value) || "0");
              setTotalAmount(n);
            }}
            className="mt-2 w-full h-12 rounded-xl border border-[var(--color-grey-250)] bg-white px-4 title1 text-[var(--color-grey-950)] outline-none focus:border-[var(--color-light-green)] focus:ring-2 focus:ring-[var(--color-light-green)]/20 transition-all"
          />
        </div>
      </div>

      {/* 카테고리 */}
      <SectionTitle>소비 유형</SectionTitle>
      <p className="mt-1 caption2 text-[var(--color-grey-550)]">
        자동 분류 결과를 수정할 수 있어요
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {(["배달 음식", "외식", "카페·음료"] as Category[]).map((c) => (
          <Chip key={c} label={c} selected={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {(["의류·패션", "기타"] as Category[]).map((c) => (
          <Chip key={c} label={c} selected={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      {/* 품목 리스트 */}
      <SectionTitle>품목</SectionTitle>
      <p className="mt-1 caption2 text-[var(--color-grey-550)]">
        품목 수정이 가능해요
      </p>

      <div className="mt-3 grid gap-3">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[var(--color-grey-250)] bg-white p-3"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_56px_84px] gap-2 items-center">
              <input
                value={it.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
                placeholder="품목명"
                className="h-11 rounded-xl border border-[var(--color-grey-150)] px-3 body2 text-[var(--color-grey-950)] outline-none focus:border-[var(--color-light-green)]"
              />
              <input
                value={String(it.qty)}
                onChange={(e) => {
                  const n = Number(numberOnly(e.target.value) || "0");
                  updateItem(idx, { qty: Math.max(1, n) });
                }}
                className="h-11 rounded-xl border border-[var(--color-grey-150)] px-2 label2 text-[var(--color-grey-950)] text-center outline-none"
                inputMode="numeric"
              />
              <input
                value={it.price.toLocaleString()}
                onChange={(e) => {
                  const n = Number(numberOnly(e.target.value) || "0");
                  updateItem(idx, { price: n });
                }}
                className="h-11 rounded-xl border border-[var(--color-grey-150)] px-2 label2 text-[var(--color-grey-950)] text-right outline-none"
                inputMode="numeric"
              />
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="caption1 text-[var(--color-grey-450)] hover:text-[var(--color-grey-750)] transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="w-full h-12 rounded-2xl border border-[var(--color-grey-250)] bg-white label1 text-[var(--color-grey-750)] hover:bg-[var(--color-grey-50)] transition-all"
        >
          + 추가
        </button>
      </div>

      {/* 하단 고정 저장하기 버튼 컨테이너 */}
      <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className={cn(
            "h-14 w-full rounded-2xl label1 text-white shadow-lg transition-all active:scale-[0.98]",
            !canSave ? "bg-[var(--color-pale-green)]" : "bg-[var(--color-green)]"
          )}
        >
          저장하기
        </button>
      </div>

      <div className="h-24" />
    </>
  );
}
