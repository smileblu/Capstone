import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InputPage() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-3">

        {/* 타이틀 */}
        <section className="pt-2 text-center">
          <h2 className="h0 text-[var(--color-dark-green)]">기록 입력</h2>
          <p className="mt-2 body2 text-[var(--color-grey-550)]">
            오늘의 생활 데이터를 입력하면 바로 분석할 수 있어요
          </p>
        </section>

        {/* 자동 인식 배너 */}
        <button
          type="button"
          className="h-9 w-full rounded-xl bg-[var(--color-grey-250)] body2 text-[var(--color-grey-650)]"
          onClick={() => alert("자동 인식 기능(추후 OCR/연동)")}
        >
          자동 인식 기능 사용 가능
        </button>

        {/* 입력 카드 리스트 */}
        <div className="grid gap-3 pt-8">
          <InputCard
            title="이동"
            subtitle="이동 수단과 거리"
            onClick={() => navigate("/personal/input/transport")}
          />
          <InputCard
            title="전기"
            subtitle="오늘의 전기 사용"
            onClick={() => navigate("/personal/input/electricity")}
          />
          <InputCard
            title="음식·소비"
            subtitle="식사 및 소비 기록"
            onClick={() => navigate("/personal/input/consumption")}
          />
        </div>

        {/* 오늘 기록 요약 보기 */}
        <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
          <button
            type="button"
            className="h-14 w-full rounded-2xl bg-[var(--color-green)] label1 text-white shadow-lg transition-all active:scale-[0.98] hover:brightness-95"
            onClick={() => navigate("/personal/input/summary")}
          >
            오늘 기록 요약 보기
          </button>
        </div>

        <div className="h-28" />
    </div>
  );
}

function InputCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-[var(--color-grey-250)] bg-white px-5 py-5 text-left shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="title1 text-[var(--color-grey-950)]">{title}</div>
          <div className="mt-1 body2 text-[var(--color-grey-550)]">{subtitle}</div>
        </div>
        <ChevronRight className="h-6 w-6 text-[var(--color-grey-350)]" />
      </div>
    </button>
  );
}
