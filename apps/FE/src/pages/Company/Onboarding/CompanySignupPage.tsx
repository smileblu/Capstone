import { useState, useMemo } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import CompanyPageHeader from "../CompanyPageHeader";
import type {
  CompanyIndustry,
  CompanyEmployeeRange,
  CompanyOnboardingData,
  CompanyEmissionCategory,
  CompanyManagementPurpose,
} from "../../../types/company/companyActivity";

// 0: 기업 정보
// 1: 담당자 입력
// 2: STEP 1 - 배출 항목
// 3: STEP 2 - 관리 목적
// 4: 완료
type Page = 0 | 1 | 2 | 3 | 4;

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "cursor-pointer body1 h-9 rounded-[12px] border px-4 transition-all duration-150 active:scale-[0.99]",
        active
          ? "bg-[var(--color-green)] text-[var(--color-white)] border-transparent"
          : "bg-white text-[var(--color-grey-550)] border-[var(--color-grey-350)] hover:bg-[var(--color-grey-150)]",
      )}
    >
      {children}
    </button>
  );
}

function BottomButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "fixed bottom-10 label1 h-12 w-[338px] rounded-[12px] transition-all duration-150",
        disabled
          ? "bg-[var(--color-grey-250)] text-[var(--color-grey-450)]"
          : "bg-[var(--color-green)] text-white active:scale-[0.99]",
      )}
    >
      {label}
    </button>
  );
}

const INDUSTRY_LABELS: Record<CompanyIndustry, string> = {
  MANUFACTURING: "제조업",
  IT: "IT / 소프트웨어",
  DISTRIBUTION: "유통 / 물류",
  CONSTRUCTION: "건설",
  SERVICE: "서비스업",
  FINANCE: "금융",
  OTHER: "기타",
};

const EMPLOYEE_LABELS: Record<CompanyEmployeeRange, string> = {
  lt10: "10명 미만",
  "10to50": "10 ~ 50명",
  "50to100": "50 ~ 100명",
  "100to300": "100 ~ 300명",
  gt300: "300명 이상",
};

export default function CompanySignupPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState<Page>(0);
  const [data, setData] = useState<CompanyOnboardingData>({});
  const [submitting, setSubmitting] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pwConfirmError, setPwConfirmError] = useState<string | null>(null);

  const validateEmail = (v: string) => {
    if (!v) return "이메일을 입력해주세요.";
    if (!/@/.test(v)) return "이메일 형식에 맞게 입력해주세요.";
    return null;
  };
  const validatePassword = (v: string) => {
    if (!v) return "비밀번호를 입력해주세요.";
    if (v.length < 8) return "8자 이상 입력해주세요.";
    if (
      !/[a-zA-Z]/.test(v) ||
      !/[0-9]/.test(v) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(v)
    )
      return "영어, 숫자, 특수문자를 모두 포함해야 해요.";
    return null;
  };

  // const canPage0 =
  //   !!data.email &&
  //   !validateEmail(data.email) &&
  //   !!data.password &&
  //   !validatePassword(data.password) &&
  //   !!data.passwordConfirm &&
  //   data.password === data.passwordConfirm &&
  //   !!data.managerName;
  const canPage0 = true;

  // const canPage1 =
  //   !!data.companyName && !!data.industry && !!data.employeeRange;
  const canPage1 = true;

  const pageLabel = useMemo(() => {
    if (page === 2) return "STEP 1/2";
    if (page === 3) return "STEP 2/2";
    return "";
  }, [page]);

  const goBack = () => {
    if (page === 0) return navigate(-1);
    if (page === 1) return setPage(0);
    if (page === 2) return setPage(1);
    if (page === 3) return setPage(2);
  };

  const submitAccount = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await axiosInstance.post("/auth/signup", {
        email: data.email,
        password: data.password,
        name: data.managerName,
        userType: "BUSINESS",
      });
      const loginData = await axiosInstance.post<
        any,
        { accessToken: string; userId: number }
      >("/auth/login", { email: data.email, password: data.password });
      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("userId", String(loginData.userId));
      setPage(2);
    } catch (e: any) {
      alert(e?.message ?? "회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitOnboarding = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await axiosInstance.post("/onboarding/company", {
        companyName: data.companyName,
        businessNumber: data.businessNumber,
        industry: data.industry,
        employeeRange: data.employeeRange,
        workplaceCount: data.workplaceCount ? Number(data.workplaceCount) : null,
        department: data.department,
        emissionCategories: data.emissionCategories ?? [],
        managementPurpose: data.managementPurpose,
      });
      setPage(4);
    } catch {
      alert("회사 정보 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmissionCategory = (cat: CompanyEmissionCategory) => {
    setData((d) => {
      const prev = d.emissionCategories ?? [];
      return {
        ...d,
        emissionCategories: prev.includes(cat)
          ? prev.filter((c) => c !== cat)
          : [...prev, cat],
      };
    });
  };

  return (
    <div>
      {/* 상단 바 */}
      {page !== 4 && (
        <CompanyPageHeader title="기업 회원가입" showBack onBack={goBack} />
      )}

      {/* 안내 문구 */}
      <div className="pl-3 mt-12">
        {page === 0 && (
          <div className="title1 text-[var(--color-black)]">
            기업 정보를 입력해주세요
          </div>
        )}
        {page === 1 && (
          <div className="title1 text-[var(--color-black)]">
            담당자 정보를 입력해주세요
          </div>
        )}
        {(page === 2 || page === 3) && (
          <div>
            <div className="title1 text-[var(--color-black)]">
              더 정확한 분석을 위해
              <br />몇 가지만 알려주세요!
            </div>
            <div className="mt-7 body1 text-[var(--color-grey-550)]">
              {pageLabel}
            </div>
          </div>
        )}
      </div>

      {/* PAGE 0: 기업 정보 */}
      {page === 0 && (
        <div className="px-3 mt-6 space-y-6">
          <div>
            <div className="label2 text-[var(--color-black)]">회사명</div>
            <input
              value={data.companyName ?? ""}
              onChange={(e) =>
                setData((d) => ({ ...d, companyName: e.target.value }))
              }
              placeholder="회사명을 입력해주세요"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>

          <div>
            <div className="label2 text-[var(--color-black)]">사업자 등록번호</div>
            <input
              value={data.businessNumber ?? ""}
              onChange={(e) =>
                setData((d) => ({ ...d, businessNumber: e.target.value }))
              }
              placeholder="000-00-00000"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>

          <div>
            <div className="label2 text-[var(--color-black)]">산업 분야</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(INDUSTRY_LABELS) as CompanyIndustry[]).map(
                (key) => (
                  <Chip
                    key={key}
                    active={data.industry === key}
                    onClick={() => setData((d) => ({ ...d, industry: key }))}
                  >
                    {INDUSTRY_LABELS[key]}
                  </Chip>
                ),
              )}
            </div>
          </div>

          <div>
            <div className="label2 text-[var(--color-black)]">회사 규모 (직원 수)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(EMPLOYEE_LABELS) as CompanyEmployeeRange[]).map(
                (key) => (
                  <Chip
                    key={key}
                    active={data.employeeRange === key}
                    onClick={() =>
                      setData((d) => ({ ...d, employeeRange: key }))
                    }
                  >
                    {EMPLOYEE_LABELS[key]}
                  </Chip>
                ),
              )}
            </div>
          </div>

          <div>
            <div className="label2 text-[var(--color-black)]">사업장 수</div>
            <input
              value={data.workplaceCount ?? ""}
              onChange={(e) =>
                setData((d) => ({ ...d, workplaceCount: e.target.value }))
              }
              placeholder="사업장 수를 입력해주세요"
              type="number"
              min="1"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>

          <BottomButton
            label="다음"
            disabled={!canPage0}
            onClick={() => setPage(1)}
          />
        </div>
      )}

      {/* PAGE 1: 담당자 입력 */}
      {page === 1 && (
        <div className="px-3 mt-6 space-y-3">
          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">이름</div>
            <input
              value={data.managerName ?? ""}
              onChange={(e) =>
                setData((d) => ({ ...d, managerName: e.target.value }))
              }
              placeholder="실명 입력"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>

          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">부서</div>
            <input
              value={data.department ?? ""}
              onChange={(e) =>
                setData((d) => ({ ...d, department: e.target.value }))
              }
              placeholder="부서명 입력"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>

          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">이메일</div>
            <input
              value={data.email ?? ""}
              onChange={(e) => {
                setData((d) => ({ ...d, email: e.target.value }));
                setEmailError(validateEmail(e.target.value));
              }}
              onBlur={(e) => setEmailError(validateEmail(e.target.value))}
              placeholder="example@company.com"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
            {emailError && (
              <div className="mt-1 pl-2 caption2 text-red-500">{emailError}</div>
            )}
          </div>

          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">비밀번호</div>
            <input
              value={data.password ?? ""}
              onChange={(e) => {
                setData((d) => ({ ...d, password: e.target.value }));
                setPasswordError(validatePassword(e.target.value));
              }}
              onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
              type="password"
              placeholder="영어, 숫자, 특수문자 포함 8자 이상"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
            {passwordError && (
              <div className="mt-1 pl-2 caption2 text-red-500">{passwordError}</div>
            )}
            <input
              value={data.passwordConfirm ?? ""}
              onChange={(e) => {
                setData((d) => ({ ...d, passwordConfirm: e.target.value }));
                setPwConfirmError(
                  e.target.value !== data.password ? "비밀번호가 일치하지 않아요." : null,
                );
              }}
              type="password"
              placeholder="비밀번호 재입력"
              className="body1 mt-3 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
            {pwConfirmError && (
              <div className="mt-1 pl-2 caption2 text-red-500">{pwConfirmError}</div>
            )}
          </div>

          <BottomButton
            label={submitting ? "처리 중..." : "다음"}
            disabled={!canPage1 || submitting}
            onClick={submitAccount}
          />
        </div>
      )}

      {/* STEP 1: 배출 항목 */}
      {page === 2 && (
        <div className="px-3 mt-6">
          <div className="label1 text-[var(--color-black)]">
            어떤 배출 항목을 관리하시나요?
          </div>
          <div className="mt-1 body1 text-[var(--color-grey-550)]">복수 선택 가능</div>

          <div className="mt-4 space-y-3">
            {(
              [
                { key: "ELECTRICITY", title: "전력 사용", desc: "사업장 전기 사용량 기반 계산" },
                { key: "FUEL", title: "연료 사용", desc: "난방 보일러 설비 연료 사용" },
                { key: "LOGISTICS", title: "물류/운송", desc: "배송 운송 거리 및 수단 반영" },
                { key: "BUSINESS_TRIP", title: "출장", desc: "임직원 이동 데이터 기반 계산" },
                { key: "WASTE", title: "폐기물", desc: "폐기물 종류와 배출량 반영" },
              ] as { key: CompanyEmissionCategory; title: string; desc: string }[]
            ).map(({ key, title, desc }) => {
              const active = (data.emissionCategories ?? []).includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleEmissionCategory(key)}
                  className={cx(
                    "flex flex-col items-start w-full rounded-[12px] border px-4 py-3 text-left transition-all duration-150 active:scale-[0.99]",
                    active
                      ? "border-transparent bg-[var(--color-green)] text-white"
                      : "bg-white text-[var(--color-black)] border-[var(--color-grey-350)]",
                  )}
                >
                  <div className="label2">{title}</div>
                  <div className={cx("caption2 mt-0.5", active ? "text-white/80" : "text-[var(--color-grey-550)]")}>
                    {desc}
                  </div>
                </button>
              );
            })}
          </div>

          <BottomButton
            label="다음"
            disabled={!canPage0}
            onClick={() => setPage(3)}
          />
        </div>
      )}

      {/* STEP 2: 관리 목적 */}
      {page === 3 && (
        <div className="px-3 mt-6">
          <div className="label1 text-[var(--color-black)]">
            탄소 배출 관리를 어떤 목적으로 사용하시나요?
          </div>
          <div className="mt-1 body1 text-[var(--color-grey-550)]">나중에 수정할 수 있어요</div>

          <div className="mt-4 space-y-3">
            {(
              [
                { key: "INTERNAL", title: "내부 관리", desc: "배출 현황 파악과 비용 절감 중심" },
                { key: "CLIENT_SUBMISSION", title: "고객사 제출", desc: "협력사 납품처 요청 대응" },
                { key: "ESG_COMPLIANCE", title: "ESG 규제 대응", desc: "보고서 및 공시 대응 준비" },
              ] as { key: CompanyManagementPurpose; title: string; desc: string }[]
            ).map(({ key, title, desc }) => {
              const active = data.managementPurpose === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, managementPurpose: key }))}
                  className={cx(
                    "flex flex-col items-start w-full rounded-[12px] border px-4 py-3 text-left transition-all duration-150 active:scale-[0.99]",
                    active
                      ? "border-transparent bg-[var(--color-green)] text-white"
                      : "bg-white text-[var(--color-black)] border-[var(--color-grey-350)]",
                  )}
                >
                  <div className="label2">{title}</div>
                  <div className={cx("caption2 mt-0.5", active ? "text-white/80" : "text-[var(--color-grey-550)]")}>
                    {desc}
                  </div>
                </button>
              );
            })}
          </div>

          <BottomButton
            label={submitting ? "저장 중..." : "완료"}
            disabled={!canPage1 || submitting}
            onClick={submitOnboarding}
          />
        </div>
      )}

      {/* 완료 */}
      {page === 4 && (
        <div className="mt-75 px-3 flex flex-col items-center justify-center">
          <div className="title1 text-center text-[var(--color-grey-900)]">
            🎉
            <br />
            설정이 완료되었어요!
          </div>
          <div className="caption2 mt-2 text-center text-[var(--color-grey-550)]">
            이제 우리 회사의 탄소 배출을
            <br />한 눈에 확인해보세요
          </div>
          <button
            type="button"
            onClick={() => navigate("/company/home")}
            className="fixed bg-[var(--color-green)] text-white bottom-10 label1 h-12 w-[338px] rounded-[12px] transition-all duration-150"
          >
            홈으로 이동
          </button>
        </div>
      )}
    </div>
  );
}
