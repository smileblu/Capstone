import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function CompanyReportHistoryPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* 상단 바 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="h-6 w-6 text-[var(--color-grey-750)]" />
        </button>
        <div className="flex-1 text-center">
          <div className="h0 text-[var(--color-dark-green)]">보고서 히스토리</div>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* 빈 상태 */}
      <div className="mt-24 flex flex-col items-center justify-center gap-3">
        <FileText className="h-12 w-12 text-[var(--color-grey-350)]" />
        <div className="body1 text-[var(--color-grey-450)]">아직 생성된 보고서가 없어요</div>
        <div className="caption2 text-[var(--color-grey-350)]">탄소 배출 분석 후 보고서를 생성할 수 있어요</div>
      </div>
    </div>
  );
}
