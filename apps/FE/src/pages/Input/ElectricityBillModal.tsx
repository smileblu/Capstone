import { useState } from "react";

interface Props {
  isOpen: boolean;
  currentBill: number;
  onSave: (bill: number, people: number) => void;
  onClose: () => void;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ElectricityBillModal({ isOpen, currentBill, onSave, onClose }: Props) {
  const [inputValue, setInputValue] = useState<string>(currentBill.toString());
  const [people, setPeople] = useState<number>(1);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setInputValue(val);
  };

  const handleSave = () => {
    onSave(Number(inputValue), people);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-5">
      <div className="w-full max-w-[326px] rounded-[24px] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="title1 text-[var(--color-grey-950)]">전기요금 설정</h2>
          <button onClick={onClose} className="p-2 text-[var(--color-grey-400)] text-xl hover:text-[var(--color-grey-600)] transition-colors">✕</button>
        </div>

        {/* 요금 입력 */}
        <div className="mb-8">
          <label className="caption1 text-[var(--color-grey-600)] mb-2 block font-medium">이번 달 예상 요금</label>
          <div className="relative border-b-2 border-[var(--color-green)]">
            <input
              type="text"
              autoFocus
              value={Number(inputValue).toLocaleString()}
              onChange={handleInputChange}
              className="w-full py-2 text-2xl font-bold text-[var(--color-green)] bg-transparent focus:outline-none"
            />
            <span className="absolute right-0 bottom-2 text-lg font-medium text-[var(--color-grey-950)]">원</span>
          </div>
        </div>

        {/* 인원 설정 */}
        <div className="mb-8 px-1">
          <div className="flex items-center justify-between mb-5">
            <label className="caption1 text-[var(--color-grey-600)] font-medium">함께 거주하는 인원</label>
          </div>

          <div className="flex items-center justify-between px-6">
            {/* 마이너스 버튼 */}
            <button 
              type="button"
              disabled={people <= 1}
              onClick={() => setPeople(Math.max(1, people - 1))}
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center border transition",
                people <= 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-[var(--color-grey-150)] active:scale-[0.95]"
              )}
              style={{ 
                borderColor: "var(--color-grey-250)", 
                backgroundColor: "var(--color-grey-50)", 
                color: "var(--color-grey-950)" 
              }}
            >
              <span className="text-xl font-light">−</span>
            </button>

            {/* 숫자 표시 */}
            <div className="flex items-baseline gap-0.5">
              <span className="label1 font-bold text-[var(--color-grey-950)] text-xl tracking-tight">{people}</span>
              <span className="label1 font-medium text-[var(--color-grey-950)]">명</span>
            </div>

            {/* 플러스 버튼 */}
            <button 
              type="button"
              onClick={() => setPeople(people + 1)}
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center border transition",
                "hover:bg-[var(--color-grey-150)] active:scale-[0.95]"
              )}
              style={{ 
                borderColor: "var(--color-grey-250)", 
                backgroundColor: "var(--color-grey-50)", 
                color: "var(--color-grey-950)" 
              }}
            >
              <span className="text-xl font-light">+</span>
            </button>
          </div>

          <p className="mt-5 text-[10px] text-[var(--color-grey-400)] text-center tracking-tight">
            * 입력하신 인원 수만큼 요금을 나누어 계산해요
          </p>
        </div>

        {/* 설정 완료 버튼 */}
        <button
          onClick={handleSave}
          className="h-14 w-full rounded-2xl bg-[var(--color-green)] label1 text-white shadow-lg active:scale-[0.98] transition-all"
        >
          설정 완료
        </button>
      </div>
    </div>
  );
}