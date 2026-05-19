import { useEffect, useState } from "react";
import CompanyPageHeader from "../CompanyPageHeader";
import axiosInstance from "../../../api/axiosInstance";

type MyInfo = {
  companyName?: string;
  businessNumber?: string;
  industry?: string;
  employeeRange?: string;
  workplaceCount?: number;
  managerName?: string;
  department?: string;
  email?: string;
};

const INDUSTRY_LABEL: Record<string, string> = {
  MANUFACTURING: "제조업", IT: "IT / 소프트웨어", DISTRIBUTION: "유통 / 물류",
  CONSTRUCTION: "건설", SERVICE: "서비스업", FINANCE: "금융", OTHER: "기타",
};
const EMPLOYEE_LABEL: Record<string, string> = {
  lt10: "10명 미만", "10to50": "10 ~ 50명", "50to100": "50 ~ 100명",
  "100to300": "100 ~ 300명", gt300: "300명 이상",
};

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex h-12 w-full items-center justify-between rounded-[12px] border border-[var(--color-grey-350)] bg-white px-4">
      <span className="body1 text-[var(--color-grey-550)]">{label}</span>
      <span className="body1 text-[var(--color-grey-750)]">{value ?? "-"}</span>
    </div>
  );
}

export default function CompanyMyInfoPage() {
  const [info, setInfo] = useState<MyInfo>({});

  useEffect(() => {
    axiosInstance.get<any, MyInfo>("/company/myinfo")
      .then(setInfo)
      .catch(() => {});
  }, []);

  return (
    <div>
      <CompanyPageHeader title="내 정보 관리" showBack />

      <div className="mt-8">
        <div className="pl-2 title1 text-[var(--color-black)]">기업 정보</div>
        <div className="mt-2 space-y-2">
          <Row label="회사명" value={info.companyName} />
          <Row label="사업자 등록번호" value={info.businessNumber} />
          <Row label="산업 분야" value={info.industry ? (INDUSTRY_LABEL[info.industry] ?? info.industry) : undefined} />
          <Row label="회사 규모" value={info.employeeRange ? (EMPLOYEE_LABEL[info.employeeRange] ?? info.employeeRange) : undefined} />
          <Row label="사업장 수" value={info.workplaceCount != null ? String(info.workplaceCount) : undefined} />
        </div>
      </div>

      <div className="mt-7">
        <div className="pl-2 title1 text-[var(--color-black)]">담당자 정보</div>
        <div className="mt-2 space-y-2">
          <Row label="이름" value={info.managerName} />
          <Row label="부서" value={info.department} />
          <Row label="이메일" value={info.email} />
        </div>
      </div>
    </div>
  );
}
