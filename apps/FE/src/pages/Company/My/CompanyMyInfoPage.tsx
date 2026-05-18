import CompanyPageHeader from "../CompanyPageHeader";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex h-12 w-full items-center justify-between rounded-[12px] border border-[var(--color-grey-350)] bg-white px-4">
      <span className="body1 text-[var(--color-grey-550)]">{label}</span>
      <span className="body1 text-[var(--color-grey-750)]">{value ?? "-"}</span>
    </div>
  );
}

export default function CompanyMyInfoPage() {
  return (
    <div>
      {/* 상단 바 */}
      <CompanyPageHeader title="내 정보 관리" showBack />

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
