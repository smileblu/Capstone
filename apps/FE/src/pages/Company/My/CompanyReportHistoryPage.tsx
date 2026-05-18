import { FileText } from "lucide-react";
import CompanyPageHeader from "../CompanyPageHeader";

export default function CompanyReportHistoryPage() {
  return (
    <div>
      {/* 상단 바 */}
      <CompanyPageHeader title="보고서 히스토리" showBack />

      {/* 빈 상태 */}
      <div className="mt-24 flex flex-col items-center justify-center gap-3">
        <FileText className="h-12 w-12 text-[var(--color-grey-350)]" />
        <div className="body1 text-[var(--color-grey-450)]">아직 생성된 보고서가 없어요</div>
        <div className="caption2 text-[var(--color-grey-350)]">탄소 배출 분석 후 보고서를 생성할 수 있어요</div>
      </div>
    </div>
  );
}
