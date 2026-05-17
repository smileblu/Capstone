import { AlertTriangle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BusinessInputPage() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-3 pb-28">
      {/* 타이틀 */}
      <section className="pt-2 text-center">
        <h2 className="h0 text-[var(--color-dark-green)]">
          탄소 데이터 입력
        </h2>
        <p className="mt-2 body2 text-[var(--color-grey-550)]">
          매달 초 지난 달 배출 데이터를 입력해주세요
        </p>
      </section>

      {/* 입력 기간 안내 */}
      <section className="mt-3 rounded-xl bg-[var(--color-grey-250)] px-5 py-2.5">
        <p className="body2 text-[var(--color-grey-650)]">
          입력 대상 기간 : 2026년 3월
        </p>
        <p className="mt-1 body2 text-[var(--color-grey-650)]">
          입력 가능 기간 : 2026.04.01 ~ 2026.04.10.
        </p>
      </section>

      {/* 입력 카드 리스트 */}
      <div className="grid gap-3 pt-2">
        <InputCard
          title="전기"
          subtitle="Scope 2 : 전력 사용량 (kWh)"
          completed={true}
          onClick={() => navigate("/company/input/electricity")}
        />

        <InputCard
          title="고정 연소 (연료)"
          subtitle="Scope 1 : 연료 사용량 (L / Nm³ / kg)"
          onClick={() => navigate("/company/input/stationary-combustion")}
        />

        <InputCard
          title="이동 연소 (차량, 물류, 운송)"
          subtitle="이동 거리 또는 연료 사용량"
          status="warning"
          onClick={() => navigate("/company/input/mobile-combustion")}
        />

        <InputCard
          title="공정 가스 배출"
          subtitle="가스 사용량 (kg)"
          status="danger"
          onClick={() => navigate("/company/input/gas")}
        />

        <InputCard
          title="폐기물, 연소"
          subtitle="처리량 (kg / ton / m³)"
          onClick={() => navigate("/company/input/waste")}
        />
        <InputCard
          title="용수"
          subtitle="물 사용량 및 폐수량 (ton / m³ / L)"
          onClick={() => navigate("/company/input/water")}
        />
      </div>

      {/* 완료 버튼 */}
      <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
        <button
          type="button"
          className="h-14 w-full rounded-xl bg-[var(--color-green)] label1 text-white shadow-lg transition-all active:scale-[0.98] hover:brightness-95"
          onClick={() => navigate("/company/analyzation")}
        >
          이번 달 입력 완료하기
        </button>
      </div>
    </div>
  );
}

function InputCard({
  title,
  subtitle,
  onClick,
  completed = false,
  status,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
  completed?: boolean;
  status?: "warning" | "danger";
}) {
  const isWarning = status === "warning";
  const isDanger = status === "danger";

  return (
    <button
      type="button"
      disabled={completed}
      onClick={!completed ? onClick : undefined}
      style={{
        backgroundColor: isDanger
          ? "rgba(255,145,145,0.25)"
          : undefined,
      }}
      className={[
        "w-full rounded-2xl px-7 py-4 text-left transition-all active:scale-[0.99]",
        completed
          ? "cursor-default border border-transparent bg-[var(--color-grey-250)]"
          : "border border-[var(--color-grey-250)] bg-white active:scale-[0.99]",
        isWarning && "border-2 border-red-500 bg-white",
        isDanger && "border-none",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="title1 text-black">{title}</div>
          <div className="mt-2 body2 text-[var(--color-grey-550)]">
            {subtitle}
          </div>
        </div>

        {isWarning && (
          <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--color-dark-green)]" />
        )}

        {isDanger && (
          <AlertCircle className="h-6 w-6 shrink-0 text-red-700" />
        )}
      </div>
    </button>
  );
}