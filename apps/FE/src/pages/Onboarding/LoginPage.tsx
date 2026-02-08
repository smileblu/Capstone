import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

type LoginType = "personal" | "company";

export default function LoginPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const type: LoginType = useMemo(() => {
    const t = params.get("type");
    return t === "company" ? "company" : "personal";
  }, [params]);

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const loginButton = async () => {
    // 예시
    const endpoint = type === "personal" ? "/personal/login" : "/company/login";

    try {
      const res = await axios.post(endpoint, {
        username: id,
        password: pw,
      });

      // 예: 토큰 저장
      // localStorage.setItem("accessToken", res.data.accessToken);

      // 예: 타입별 홈으로 이동
      navigate(type === "personal" ? "/personal/analyzation" : "/company/home");
    } catch (e) {
      console.log(e);
      // TODO: 에러 토스트/문구 처리
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px-80px)] flex flex-col items-center justify-center">
      <h1 className="text-center h0 text-[var(--color-green)]">COCO</h1>

      {/* 탭 */}
      <div className="mt-5 flex justify-center gap-4">
        <button
          type="button"
          onClick={() => setParams({ type: "personal" })}
          className={`caption1 h-8 w-27 rounded-full border  ${
            type === "personal"
              ? "bg-[var(--color-green)] text-[var(--color-white)] border-transparent"
              : "bg-white text-[var(--color-grey-550)] border-[var(--color-grey-350)]"
          }`}
        >
          개인
        </button>
        <button
          type="button"
          onClick={() => setParams({ type: "company" })}
          className={`caption1 h-8 w-27 rounded-full border ${
            type === "company"
              ? "bg-[var(--color-green)] text-white border-transparent"
              : "bg-white text-[var(--color-grey-550)] border-[var(--color-grey-350)]"
          }`}
        >
          기업
        </button>
      </div>

      {/* 입력 */}
      <div className="mt-6 space-y-3 flex flex-col ">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="아이디를 입력해주세요"
          className="body1 h-9 w-70 rounded-lg bg-[var(--color-grey-250)] text-[var(--color-grey-550)] px-4"
        />
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
          placeholder="비밀번호를 입력해주세요"
          className="body1 h-9 w-70 rounded-lg bg-[var(--color-grey-250)] text-[var(--color-grey-550)] px-4"
        />

        <button
          type="button"
          onClick={loginButton}
          className="cursor-pointer body1 mt-2 h-9 w-70 rounded-lg bg-[var(--color-green)] text-white"
        >
          로그인
        </button>
      </div>

      <div className="mt-6 caption1 text-center text-[var(--color-black)]">
        <button
          type="button"
          onClick={() => navigate("/reset-password")}
          className="cursor-pointer"
        >
          비밀번호 재설정
        </button>
        <span className="mx-2 text-[var(--color-grey-550)]">|</span>
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="cursor-pointer"
        >
          회원가입
        </button>
      </div>
    </div>
  );
}
