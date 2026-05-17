import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function CompanySecurityPage() {
  const navigate = useNavigate();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = !!currentPw && !!newPw && newPw === confirmPw && newPw.length >= 8;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      // TODO: await axiosInstance.put("/mypage/password", { currentPassword: currentPw, newPassword: newPw });
      alert("비밀번호가 변경되었어요.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setError(null);
    } catch {
      setError("비밀번호 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

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
          <div className="h0 text-[var(--color-dark-green)]">보안</div>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* 비밀번호 변경 */}
      <div className="mt-8">
        <div className="pl-2 title1 text-[var(--color-black)]">비밀번호 변경</div>
        <div className="mt-3 space-y-3">
          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">현재 비밀번호</div>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="현재 비밀번호 입력"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>
          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">새 비밀번호</div>
            <input
              type="password"
              value={newPw}
              onChange={(e) => {
                setNewPw(e.target.value);
                setError(null);
              }}
              placeholder="영어, 숫자, 특수문자 포함 8자 이상"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
          </div>
          <div>
            <div className="pl-2 body1 text-[var(--color-grey-550)]">새 비밀번호 확인</div>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => {
                setConfirmPw(e.target.value);
                setError(null);
              }}
              placeholder="새 비밀번호 재입력"
              className="mt-1 body1 h-9 w-full rounded-[12px] bg-[var(--color-grey-250)] px-4 outline-none"
            />
            {confirmPw && newPw !== confirmPw && (
              <div className="mt-1 pl-2 caption2 text-red-500">비밀번호가 일치하지 않아요.</div>
            )}
          </div>

          {error && <div className="pl-2 caption2 text-red-500">{error}</div>}
        </div>

        <button
          type="button"
          disabled={!canSave || saving}
          onClick={handleSave}
          className={cx(
            "mt-6 w-full h-12 rounded-[12px] label1 transition-all duration-150 active:scale-[0.99]",
            canSave && !saving
              ? "bg-[var(--color-green)] text-white"
              : "bg-[var(--color-grey-250)] text-[var(--color-grey-450)]",
          )}
        >
          {saving ? "저장 중..." : "변경하기"}
        </button>
      </div>
    </div>
  );
}
