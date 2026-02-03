import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  impactText: string; // "- 4.5kgCO₂ | 650원 절약"
  difficulty: "하" | "중" | "상";
};

const scenarios: Scenario[] = [
  {
    id: "s1",
    title: "대중교통 이용 확대",
    subtitle: "주 3일 대중교통 이용",
    impactText: "- 4.5kgCO₂ | 650원 절약",
    difficulty: "중",
  },
  {
    id: "s2",
    title: "대중교통 이용 확대",
    subtitle: "주 3일 대중교통 이용",
    impactText: "- 4.5kgCO₂ | 650원 절약",
    difficulty: "중",
  },
  {
    id: "s3",
    title: "대중교통 이용 확대",
    subtitle: "주 3일 대중교통 이용",
    impactText: "- 4.5kgCO₂ | 650원 절약",
    difficulty: "중",
  },
  {
    id: "s4",
    title: "대중교통 이용 확대",
    subtitle: "주 3일 대중교통 이용",
    impactText: "- 4.5kgCO₂ | 650원 절약",
    difficulty: "중",
  },
];

function ScenarioCard({
  item,
  onClick,
}: {
  item: Scenario;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-[var(--color-grey-150)] bg-white px-5 py-4 text-left shadow-sm active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[16px] font-extrabold text-[var(--color-grey-900)]">
            {item.title}
          </div>
          <div className="mt-1 text-[13px] text-[var(--color-grey-550)]">
            {item.subtitle}
          </div>

          <div className="mt-2 text-[14px] font-semibold text-[var(--color-green)]">
            {item.impactText}
          </div>
        </div>

        <div className="shrink-0 pt-8 text-[13px] font-medium text-[var(--color-grey-350)]">
          난이도 {item.difficulty}
        </div>
      </div>
    </button>
  );
}

export default function ScenarioPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div>
        <header>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-5 top-6 flex h-10 w-10 items-center justify-center rounded-full active:bg-[var(--color-grey-100)]"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6 text-[var(--color-grey-700)]" />
          </button>

          <div className="text-center h0 text-[var(--color-green)]">
            탄소 절감 방법
          </div>
        </header>

        <main className="mt-6">
          <div className="text-[18px] font-extrabold text-[var(--color-grey-900)]">
            탄소 절감 시나리오
          </div>
          <div className="mt-1 text-[13px] text-[var(--color-grey-400)]">
            개인 맞춤 우선 순위 순
          </div>
          <div className="mt-4 space-y-3">
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                item={s}
                onClick={() => {
                  // TODO: 시나리오 상세/선택 페이지로 이동
                  // navigate(`/saving/${s.id}`);
                  console.log("scenario click", s.id);
                }}
              />
            ))}
          </div>
          <div className="fixed left-1/2 z-40 w-[402px] -translate-x-1/2 bottom-[80px] px-5">
            <button
              type="button"
              className="label1 w-full h-12 rounded-[8px] bg-[var(--color-green)] text-[var(--color-white)] cursor-pointer"
            >
              미션하러 가기
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
