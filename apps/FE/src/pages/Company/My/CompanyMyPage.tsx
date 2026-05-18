import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import CompanyPageHeader from "../CompanyPageHeader";

const MENU_ITEMS = [
  { label: "내 정보 관리", path: "/company/my/info" },
  { label: "보고서 히스토리", path: "/company/my/report-history" },
  { label: "플랜", path: "/company/my/plan" },
  { label: "보안", path: "/company/my/security" },
];

export default function CompanyMyPage() {
  const navigate = useNavigate();

  return (
    <div>
      <CompanyPageHeader title="마이페이지" />

      {/* 인사 카드 */}
      <div className="mt-10 rounded-[12px] bg-[#E5ECD6] px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-[var(--color-grey-350)]" />
          <div className="label2 text-[var(--color-grey-900)]">
            안녕하세요!<br />
            탄소 배출 현황을 확인해보세요.
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <div className="mt-8 space-y-2">
        {MENU_ITEMS.map(({ label, path }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="flex h-12 w-full items-center justify-between rounded-[12px] border border-[var(--color-grey-350)] bg-white px-4 active:scale-[0.99] transition-all duration-150"
          >
            <span className="label2 text-[var(--color-grey-900)]">{label}</span>
            <ChevronRight className="h-5 w-5 text-[var(--color-grey-450)]" />
          </button>
        ))}
      </div>
    </div>
  );
}
