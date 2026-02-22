import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type SignupType = "personal" | "company";

// 화면 상태(단계)
type Page = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0: 계정입력
// 1: 경로 유무(예/아니오) (Step1)
// 2: 어떤 경로(프리셋 선택) (Step2-예)
// 3: 경로 상세 + 이동수단
// 4: (경로 없음) 이동 스타일 (Step2 - 아니오)
// 5: 전기요금 (Step3)
// 6: 완료

type SignupData = {
  // Page0
  email?: string;
  password?: string;
  passwordConfirm?: string;
  nickname?: string;

  // Page1
  hasFrequentRoute?: boolean;

  // Page2
  routePreset?: "home_school" | "home_work" | "custom";

  // Page3
  routeName?: string;
  departure?: string;
  arrival?: string;
  transport?: "car" | "bus" | "subway" | "bike" | "walk";

  // Page4
  mainTransport?: "car" | "public" | "walk_bike";
  dailyTime?: "lt30" | "30to60" | "60to120" | "gt120";

  // Page5
  elecBill?: "lt30k" | "30to50k" | "50to100k" | "gt100k" | "unknown";
};

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

export default function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const type: SignupType = useMemo(() => {
    const t = params.get("type");
    return t === "company" ? "company" : "personal";
  }, [params]);

  const [page, setPage] = useState<Page>(0);
  const [data, setData] = useState<SignupData>({});

  const goBack = () => {
    // page별 뒤로가기 규칙
    if (page === 0) return navigate(-1);
    if (page === 1) return setPage(0);

    // 예/아니오 분기에서 되돌아갈 때도 자연스럽게
    if (page === 2) return setPage(1);
    if (page === 3) return setPage(2);
    if (page === 4) return setPage(1); // "경로 없음"이면 page1로
    if (page === 5) {
      if (!data.hasFrequentRoute) {
        setPage(4);
      } else if (data.routePreset === "custom") {
        setPage(3);
      } else {
        setPage(2);
      }
    }
    if (page === 6) return setPage(5);
  };

  // ----- 유효성(버튼 활성화) -----
  const canNextPage0 =
    !!data.email &&
    !!data.password &&
    !!data.passwordConfirm &&
    data.password === data.passwordConfirm &&
    !!data.nickname;

  const canNextPage1 = data.hasFrequentRoute !== undefined;

  const canNextPage2 = !!data.routePreset;

  const canNextPage3 = !!data.departure && !!data.arrival && !!data.transport;

  const canNextPage4 = !!data.mainTransport && !!data.dailyTime;

  const canNextPage5 = !!data.elecBill;

  const submitSignup = async () => {
    // TODO: 백엔드 붙일 때 여기에서 POST
    // personal/company endpoint 분기 가능
    // await api.post(type === "personal" ? "/personal/signup" : "/company/signup", data);
    setPage(4);
  };

  // 상단 "PAGE x/3" 텍스트는 이미지 기준으로 1~3만 보여서 이렇게 맵핑
  const pageLabel = useMemo(() => {
    if (page === 1) return "STEP 1/3";
    if (page === 2 || page === 3 || page === 4) return "STEP 2/3";
    if (page === 5) return "STEP 3/3";
    return "";
  }, [page]);

  // 이메일 에러
  const [emailError, setEmailError] = useState<string | null>(null);
  const validateEmail = (value: string) => {
    if (!value) return "이메일을 입력해주세요.";
    if (!/@/.test(value)) return "이메일 형식에 맞게 입력해주세요.";
    return null;
  };

  type EmailVerifyStatus = "idle" | "sent" | "verified";

  const [emailStatus, setEmailStatus] = useState<EmailVerifyStatus>("idle");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const emailValue = data.email ?? "";
  const isEmailValid = !validateEmail(emailValue);

  // 비밀번호 에러
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const validatePassword = (value: string) => {
    if (!value) return "비밀번호를 입력해주세요.";
    if (value.length < 8) return "8자 이상 입력해주세요.";
    if (
      !/[a-zA-Z]/.test(value) ||
      !/[0-9]/.test(value) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(value)
    )
      return "영어, 숫자, 특수문자를 모두 포함해야 해요.";
    return null;
  };

  //비밀번호확인 에러
  const [pwConfirmError, setPwConfirmError] = useState<string | null>(null);
  const validatePasswordConfirm = (pw: string, confirm: string) => {
    if (!confirm) return "비밀번호를 한 번 더 입력해주세요.";
    if (pw !== confirm) return "비밀번호가 일치하지 않아요.";
    return null;
  };

  return (
    <div>
      {/* 상단 바 */}
      {page === 6 ? null : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-6 w-6 text-[var(--color-grey-750)]" />
          </button>
          <div className="flex-1 text-center">
            <div className="h0 text-[var(--color-dark-green)]">회원가입</div>
          </div>
          <div className="h-10 w-10" />
        </div>
      )}

      {/* 안내 문구 */}
      <div className="pl-3 mt-12">
        {page === 0 ? (
          <div>
            <div className="title1 text-[var(--color-black)]">
              이메일, 비밀번호, 닉네임을
              <br />
              입력해주세요
            </div>
          </div>
        ) : page === 5 ? (
          <div>
            <div className="title1 text-[var(--color-black)]">
              거의 다 왔어요!
              <br />
              마지막으로 하나만 더 알려주세요
            </div>
            <div className="mt-7 body1 text-[var(--color-grey-550)]">
              {pageLabel}
            </div>
          </div>
        ) : page === 6 ? null : (
          <div>
            <div className="title1 text-[var(--color-black)]">
              더 정확한 예측을 위해
              <br />몇 가지만 알려주세요!
            </div>
            <div className="mt-7 body1 text-[var(--color-grey-550)]">
              {pageLabel}
            </div>
          </div>
        )}
      </div>

      {/* STEP 0: 계정 입력 */}
      {page === 0 && (
        <div className="px-3 mt-6 space-y-3">
          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">
              이메일
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input
                value={data.email ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setData((d) => ({ ...d, email: value }));
                  setEmailError(validateEmail(value));

                  // 이메일이 바뀌면 인증 상태 초기화(중요)
                  setEmailStatus("idle");
                  setCode("");
                  setCodeError(null);
                }}
                onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                placeholder="example@gmail.com"
                className={cx(
                  "body1 h-9 flex-1 rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none",
                )}
              />
              <button
                type="button"
                disabled={!isEmailValid || emailStatus === "verified"}
                onClick={async () => {
                  // TODO: 인증 메일/코드 발송 API 호출
                  // await api.post("/auth/email/send", { email: emailValue });

                  setEmailStatus("sent");
                }}
                className={cx(
                  "caption1 h-9 rounded-[12px] px-3 transition-all active:scale-[0.99]",
                  !isEmailValid || emailStatus === "verified"
                    ? "bg-[var(--color-grey-150)] text-[var(--color-grey-350)]"
                    : "cursor-pointer bg-[var(--color-green)] text-white",
                )}
              >
                {emailStatus === "verified"
                  ? "인증완료"
                  : emailStatus === "sent"
                    ? "재전송"
                    : "이메일 인증"}
              </button>
            </div>

            {emailError && (
              <div className="mt-1 pl-2 caption2 text-red-500">
                {emailError}
              </div>
            )}

            {/* 인증번호 입력 (sent일 때만 노출) */}
            {emailStatus === "sent" && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError(null);
                  }}
                  placeholder="인증번호 6자리"
                  className={cx(
                    "w-[100px] body1 h-9 flex-1 rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none",
                    codeError
                      ? "border border-red-500"
                      : "border border-transparent",
                  )}
                />

                <button
                  type="button"
                  disabled={code.length != 6}
                  onClick={async () => {
                    try {
                      // TODO: 인증번호 검증 API 호출
                      // await api.post("/auth/email/verify", { email: emailValue, code });

                      setEmailStatus("verified");
                    } catch (e) {
                      setCodeError("인증번호가 올바르지 않아요.");
                    }
                  }}
                  className={cx(
                    "caption1 h-9 rounded-[12px] px-3 transition-all active:scale-[0.99]",
                    code.length != 6
                      ? "bg-[var(--color-grey-150)] text-[var(--color-grey-350)]"
                      : "bg-[var(--color-green)] text-[var(--color-white)]  border-[var(--color-green)]",
                  )}
                >
                  확인
                </button>
              </div>
            )}

            {/* 인증번호 에러 */}
            {codeError && (
              <div className="mt-1 pl-2 caption2 text-red-500">{codeError}</div>
            )}

            {/* 인증 완료 안내문 (선택) */}
            {emailStatus === "verified" && (
              <div className="mt-2 pl-2 caption2 text-[var(--color-green)]">
                이메일 인증이 완료되었어요.
              </div>
            )}
          </div>

          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">
              비밀번호
            </div>
            <input
              value={data.password ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setData((d) => ({ ...d, password: value }));
                setPasswordError(validatePassword(value));
              }}
              onBlur={(e) => {
                setPasswordError(validatePassword(e.target.value));
              }}
              type="password"
              placeholder="영어, 숫자, 특수문자 포함 8자 이상"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
            {passwordError && (
              <div className="mt-1 pl-2 caption2 text-red-500">
                {passwordError}
              </div>
            )}

            <input
              value={data.passwordConfirm ?? ""}
              onChange={(e) => {
                const confirm = e.target.value;
                setData((d) => ({ ...d, passwordConfirm: confirm }));
                setPwConfirmError(
                  validatePasswordConfirm(data.password ?? "", confirm),
                );
              }}
              onBlur={(e) => {
                setPwConfirmError(
                  validatePasswordConfirm(data.password ?? "", e.target.value),
                );
              }}
              type="password"
              placeholder="비밀번호 재입력"
              className="body1 mt-3 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
            {pwConfirmError && (
              <div className="mt-1 pl-2 caption2 text-red-500">
                {pwConfirmError}
              </div>
            )}
          </div>

          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">이름</div>
            <input
              value={data.nickname ?? ""}
              onChange={(e) =>
                setData((d) => ({ ...d, nickname: e.target.value }))
              }
              placeholder="실명 입력"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>

          <BottomButton
            label="완료"
            // 고쳐
            // disabled={!canNextPage0}
            onClick={() => setPage(1)}
          />
        </div>
      )}

      {/* STEP 1: 자주 이용하는 이동 경로가 있나요? */}
      {page === 1 && (
        <div className="px-3 space-y-4">
          <div className="label1 text-[var(--color-black)]">
            자주 이용하는 이동 경로가 있나요?
          </div>

          <button
            type="button"
            onClick={() => setData((d) => ({ ...d, hasFrequentRoute: true }))}
            className={cx(
              "flex flex-col items-center justify-center w-full h-20 rounded-[12px] border text-left transition-all duration-150 active:scale-[0.99]",
              data.hasFrequentRoute === true
                ? "border-transparent bg-[var(--color-green)] text-white"
                : "bg-white text-[var(--color-black)] border-[var(--color-grey-350)]",
            )}
          >
            <div className="label2">네, 있어요!</div>
            <div className="caption2 mt-1 opacity-90">
              이동 기준이 더 구체화돼요
            </div>
          </button>

          <button
            type="button"
            onClick={() => setData((d) => ({ ...d, hasFrequentRoute: false }))}
            className={cx(
              "flex flex-col items-center justify-center w-full h-20 rounded-[12px] border text-left transition-all duration-150 active:scale-[0.99]",
              data.hasFrequentRoute === false
                ? "border-transparent bg-[var(--color-green)] text-white"
                : "bg-white text-[var(--color-black)] border-[var(--color-grey-350)]",
            )}
          >
            <div className="label2">아니요, 없어요.</div>
            <div className="caption2 mt-1 opacity-90">
              기본 이동수단만 설정할게요
            </div>
          </button>

          <BottomButton
            label="다음"
            disabled={!canNextPage1}
            onClick={() => {
              if (data.hasFrequentRoute === true) {
                setPage(2);
              } else {
                setPage(4);
              }
            }}
          />
        </div>
      )}

      {/* (1) 자주 이용하는 경로가 있는 경우 */}
      {/* STEP 2: 어떤 경로를 자주 이용하나요? */}
      {page === 2 && (
        <div className="px-3">
          <div className="label1 text-[var(--color-black)]">
            어떤 경로를 자주 이용하나요?
          </div>
          <div className="mt-1 body1 text-[var(--color-grey-550)]">
            나중에 수정할 수 있어요.
          </div>

          <div className="mt-3 space-y-3">
            <button
              type="button"
              onClick={() =>
                setData((d) => ({ ...d, routePreset: "home_school" }))
              }
              className={cx(
                "label2 w-full rounded-[12px] border px-4 py-4 text-left active:scale-[0.99]",
                data.routePreset === "home_school"
                  ? "border-transparent bg-[var(--color-green)] text-white"
                  : "bg-white text-[var(--color-black)] border-[var(--color-grey-350)]",
              )}
            >
              집 ↔ 학교
            </button>

            <button
              type="button"
              onClick={() =>
                setData((d) => ({ ...d, routePreset: "home_work" }))
              }
              className={cx(
                "label2 w-full rounded-[12px] border px-4 py-4 text-left active:scale-[0.99]",
                data.routePreset === "home_work"
                  ? "border-transparent bg-[var(--color-green)] text-white"
                  : "bg-white text-[var(--color-black)] border-[var(--color-grey-350)]",
              )}
            >
              집 ↔ 회사
            </button>

            <button
              type="button"
              onClick={() => setData((d) => ({ ...d, routePreset: "custom" }))}
              className={cx(
                "label2 w-full rounded-[12px] border px-4 py-4 text-left active:scale-[0.99]",
                data.routePreset === "custom"
                  ? "border-transparent bg-[var(--color-green)] text-white"
                  : "bg-white text-[var(--color-black)] border-[var(--color-grey-350)]",
              )}
            >
              직접 입력
            </button>
          </div>

          <BottomButton
            label="다음"
            disabled={!canNextPage2}
            onClick={() => {
              if (data.routePreset === "custom") {
                setPage(3);
              } else {
                setPage(5);
              }
            }}
          />
        </div>
      )}

      {/* STEP 2에서 직접 입력 누른 경우 */}
      {page === 3 && (
        <div className="px-3 space-y-4">
          <div>
            <div className="label1 text-[var(--color-black)]">
              자주 이용하는 경로를 지정해주세요
            </div>
            <input
              value={data.routeName ?? ""}
              onChange={(e) => {
                setData((d) => ({ ...d, routeName: e.target.value }));
              }}
              placeholder="경로 이름을 입력해주세요"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>

          <div className="mt-4">
            <div className="label2 text-[var(--color-black)]">출발지</div>
            <div className="mt-1 flex items-center gap-2">
              <input
                value={data.departure ?? ""}
                onChange={(e) =>
                  setData((d) => ({ ...d, departure: e.target.value }))
                }
                placeholder="장소를 지정해주세요"
                className="body1 h-9 flex-1 rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
              />
              <button
                type="button"
                onClick={() => alert("지도 선택은 나중에!")}
                className="cursor-pointer body1 h-9 w-28 rounded-[12px] text-[var(--color-grey-550)] border border-[var(--color-grey-350)] bg-white"
              >
                지도에서 선택
              </button>
            </div>

            <div className="mt-4">
              <div className="label2 text-[var(--color-black)]">도착지</div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={data.arrival ?? ""}
                  onChange={(e) =>
                    setData((d) => ({ ...d, arrival: e.target.value }))
                  }
                  placeholder="장소를 지정해주세요"
                  className="body1 h-9 flex-1 rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
                />
                <button
                  type="button"
                  onClick={() => alert("지도 선택은 나중에!")}
                  className="cursor-pointer body1 h-9 w-28 rounded-[12px] text-[var(--color-grey-550)] border border-[var(--color-grey-350)] bg-white"
                >
                  지도에서 선택
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="label1 text-[var(--color-black)]">이동 수단</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Chip
                  active={data.transport === "car"}
                  onClick={() => setData((d) => ({ ...d, transport: "car" }))}
                >
                  차
                </Chip>
                <Chip
                  active={data.transport === "bus"}
                  onClick={() => setData((d) => ({ ...d, transport: "bus" }))}
                >
                  버스
                </Chip>
                <Chip
                  active={data.transport === "subway"}
                  onClick={() =>
                    setData((d) => ({ ...d, transport: "subway" }))
                  }
                >
                  지하철
                </Chip>
                <Chip
                  active={data.transport === "bike"}
                  onClick={() => setData((d) => ({ ...d, transport: "bike" }))}
                >
                  자전거
                </Chip>
                <Chip
                  active={data.transport === "walk"}
                  onClick={() => setData((d) => ({ ...d, transport: "walk" }))}
                >
                  걷기
                </Chip>
              </div>
            </div>
          </div>

          <BottomButton
            label="다음"
            disabled={!canNextPage3}
            onClick={() => setPage(5)} // ✅ 이미지 흐름상 경로 지정 완료 후 바로 전기요금으로 가도 됨
          />
        </div>
      )}

      {/* (2) 자주 이용하는 경로가 없는 경우 */}
      {/* STEP 2: 이동 스타일 */}
      {page === 4 && (
        <div className="px-3">
          <div className="label1 text-[var(--color-black)]">
            이동 스타일을 알려주세요.
          </div>
          <div className="mt-1 body1 text-[var(--color-grey-550)]">
            대략적인 패턴만 알아도 충분해요
          </div>

          <div className="mt-7">
            <div className="label2 text-center text-[var(--color-black)]">
              가장 자주 이용하는 이동 수단
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip
                active={data.mainTransport === "car"}
                onClick={() => setData((d) => ({ ...d, mainTransport: "car" }))}
              >
                차
              </Chip>
              <Chip
                active={data.mainTransport === "public"}
                onClick={() =>
                  setData((d) => ({ ...d, mainTransport: "public" }))
                }
              >
                대중교통
              </Chip>
              <Chip
                active={data.mainTransport === "walk_bike"}
                onClick={() =>
                  setData((d) => ({ ...d, mainTransport: "walk_bike" }))
                }
              >
                도보 · 자전거
              </Chip>
            </div>

            <div>
              <div className="mt-6 label2 text-center text-[var(--color-black)]">
                하루의 대략적인 이동 시간
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip
                  active={data.dailyTime === "lt30"}
                  onClick={() => setData((d) => ({ ...d, dailyTime: "lt30" }))}
                >
                  30분 미만
                </Chip>
                <Chip
                  active={data.dailyTime === "30to60"}
                  onClick={() =>
                    setData((d) => ({ ...d, dailyTime: "30to60" }))
                  }
                >
                  30분 ~ 1시간
                </Chip>
                <Chip
                  active={data.dailyTime === "60to120"}
                  onClick={() =>
                    setData((d) => ({ ...d, dailyTime: "60to120" }))
                  }
                >
                  1시간 ~ 2시간
                </Chip>
                <Chip
                  active={data.dailyTime === "gt120"}
                  onClick={() => setData((d) => ({ ...d, dailyTime: "gt120" }))}
                >
                  2시간 이상
                </Chip>
              </div>
            </div>
          </div>

          <BottomButton
            label="다음"
            disabled={!canNextPage4}
            onClick={() => setPage(5)}
          />
        </div>
      )}

      {/* STEP 3: 전기요금 */}
      {page === 5 && (
        <div className="px-3">
          <div className="label1 text-[var(--color-black)]">
            월 평균 전기요금은 어느 정도인가요?
          </div>
          <div className="mt-1 body1 text-[var(--color-grey-550)]">
            대략적인 구간만 선택해주세요.
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Chip
              active={data.elecBill === "lt30k"}
              onClick={() => setData((d) => ({ ...d, elecBill: "lt30k" }))}
            >
              3만원 미만
            </Chip>
            <Chip
              active={data.elecBill === "30to50k"}
              onClick={() => setData((d) => ({ ...d, elecBill: "30to50k" }))}
            >
              3~5만원
            </Chip>
            <Chip
              active={data.elecBill === "50to100k"}
              onClick={() => setData((d) => ({ ...d, elecBill: "50to100k" }))}
            >
              5~10만원
            </Chip>
            <Chip
              active={data.elecBill === "gt100k"}
              onClick={() => setData((d) => ({ ...d, elecBill: "gt100k" }))}
            >
              10만원 이상
            </Chip>
            <Chip
              active={data.elecBill === "unknown"}
              onClick={() => setData((d) => ({ ...d, elecBill: "unknown" }))}
            >
              잘 모르겠어요
            </Chip>
          </div>

          <BottomButton
            label="완료"
            disabled={!canNextPage5}
            onClick={() => setPage(6)}
          />
        </div>
      )}

      {/* STEP 4: 완료 */}
      {page === 6 && (
        <div className="mt-75 px-3 flex flex-col items-center justify-center">
          <div className="title1 text-center text-[var(--color-grey-900)]">
            🎉
            <br />
            설정이 완료되었어요!
          </div>
          <div className="caption2 mt-2 text-center text-[var(--color-grey-550)]">
            이제 당신의 생활 패턴을 바탕으로
            <br />
            탄소 배출을 분석해볼게요
          </div>

          <button
            type="button"
            onClick={() => navigate("/personal/home")}
            className="fixed bg-[var(--color-green)] text-white bottom-10 label1 h-12 w-[338px] rounded-[12px] transition-all duration-150"
          >
            홈으로 이동
          </button>
        </div>
      )}
    </div>
  );
}
