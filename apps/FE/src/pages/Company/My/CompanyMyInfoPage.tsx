import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex h-12 w-full items-center justify-between rounded-[12px] border border-[var(--color-grey-350)] bg-white px-4">
      <span className="body1 text-[var(--color-grey-550)]">{label}</span>
      <span className="body1 text-[var(--color-grey-750)]">{value ?? "-"}</span>
    </div>
  );
}

export default function CompanyMyInfoPage() {
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
          <div className="h0 text-[var(--color-dark-green)]">내 정보 관리</div>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* 기업 정보 */}
      <div className="mt-8">
        <div className="pl-2 title1 text-[var(--color-black)]">기업 정보</div>
        <div className="mt-2 space-y-2">
          <Row label="회사명" />
          <Row label="사업자 등록번호" />
          <Row label="산업 분야" />
          <Row label="회사 규모" />
          <Row label="사업장 수" />
        </div>
      </div>

      {/* 담당자 정보 */}
      <div className="mt-7">
        <div className="pl-2 title1 text-[var(--color-black)]">담당자 정보</div>
        <div className="mt-2 space-y-2">
          <Row label="이름" />
          <Row label="부서" />
          <Row label="이메일" />
        </div>
      </div>
    </div>
  );
}
