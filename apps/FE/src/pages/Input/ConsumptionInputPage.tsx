import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, PencilLine } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full h-14 rounded-2xl border bg-white px-6 transition-all",
        "flex items-center justify-center gap-3",
        "label2 text-[var(--color-grey-950)]",
        "border-[var(--color-grey-250)] hover:bg-[var(--color-grey-50)]",
      )}
    >
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      {label}
    </button>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-9 title1 text-[var(--color-black)]">{children}</h2>;
}

export default function ConsumptionInputPage() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState<"receipt" | "manual" | null>(null);

  const canSave = useMemo(() => selected !== null, [selected]);

  const onReceipt = () => {
    setSelected("receipt");
    navigate("/personal/input/consumption/receipt");
  };

  const onManual = () => {
    setSelected("manual");
    navigate("/personal/input/consumption/manual");
  };

  const onSave = () => {
    const payload = { method: selected };
    console.log("consumption save:", payload);
    alert(`저장됨!\n${JSON.stringify(payload, null, 2)}`);
  };

  return (
    <>
      {/* 페이지 타이틀 */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 h-10 w-10 rounded-full hover:bg-[var(--color-grey-150)] flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <ArrowLeft
              size={24}
              strokeWidth={2}
              color="var(--color-grey-750)"
            />
          </button>
          <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">
            음식·소비 입력
          </h1>
        </div>

        <p className="mt-2 text-center body2 text-[var(--color-grey-550)]">
          오늘의 소비 내역을 기록해주세요
        </p>
      </div>

      {/* 섹션 */}
      <SectionTitle>오늘의 소비 기록</SectionTitle>

      <div className="mt-4 grid gap-4">
        <ActionButton
          icon={<Camera size={24} strokeWidth={1.5} />}
          label="영수증 사진 업로드"
          onClick={onReceipt}
        />
        <ActionButton
          icon={<PencilLine size={24} strokeWidth={1.5} />}
          label="직접 입력"
          onClick={onManual}
        />

        <p className="text-right caption2 text-[var(--color-grey-550)]">
          영수증을 바탕으로 소비 유형을 자동으로 분류해요
        </p>
      </div>

      {/* 저장하기 버튼 */}
      <div className="fixed bottom-[84px] left-0 right-0">
        <div className="mx-auto w-[375px] px-5">
          <p className="text-center caption2 text-[var(--color-grey-550)]">
            * 소비 빈도를 기준으로 계산해요
          </p>
        </div>
      </div>
    </>
  );
}
