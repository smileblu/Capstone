import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import CompanyPageHeader from "../CompanyPageHeader";
import axiosInstance from "../../../api/axiosInstance";

const MENU_ITEMS = [
  { label: "내 정보 관리", path: "/company/my/info" },
  { label: "보고서 히스토리", path: "/company/my/report-history" },
  { label: "플랜", path: "/company/my/plan" },
  { label: "비밀번호 변경", path: "/company/my/security" },
];

export default function CompanyMyPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance.get<any, { companyName?: string; managerName?: string }>("/company/myinfo")
      .then((res) => setCompanyName(res.companyName || res.managerName || null))
      .catch(() => {});
  }, []);

  return (
    <div>
      <CompanyPageHeader title="마이페이지" />

      {/* 인사 카드 */}
      <div className="mt-10 rounded-[12px] bg-[#E5ECD6] px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-[var(--color-grey-350)]" />
          <div className="label2 text-[var(--color-grey-900)]">
            {companyName ?? "..."} 님,<br />
            회사의 탄소 배출량을 분석해볼까요?
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
