import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileDown, FileUp } from "lucide-react";
import CompanyPageHeader from "../CompanyPageHeader";
import axiosInstance from "../../../api/axiosInstance";

type InputMode = "manual" | "upload";

export type SelectFieldConfig = {
  type: "select";
  name: string;
  title: string;
  options: string[];
  columns?: 2 | 3;
  initialValue?: string;
};

export type NumberFieldConfig = {
  type: "number";
  name: string;
  title: string;
  unit: string;
  initialValue?: number;
  optional?: boolean;
};

export type FieldConfig = SelectFieldConfig | NumberFieldConfig;

type InputFormPageProps = {
  title: string;
  logType: string;
  fields: FieldConfig[];
  memoHelp: string;
};

type UploadRowError = { sheet: string; row: number; field: string; reason: string };

type UploadHistory = {
  uploadedAt: string;
  fileName: string;
  savedCount: number;
  errorCount: number;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export default function InputFormPage({ title, logType, fields, memoHelp }: InputFormPageProps) {
  const navigate    = useNavigate();
  const fileInputRef  = useRef<HTMLInputElement | null>(null);
  const uploadFileRef = useRef<File | null>(null);

  const [mode, setMode]         = useState<InputMode>("manual");
  const [memo, setMemo]         = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [errorPopup, setErrorPopup] = useState<{
    savedCount: number; errors: UploadRowError[];
  } | null>(null);

  // 폼 값 상태 — field.initialValue 또는 디폴트로 초기화
  const [values, setValues] = useState<Record<string, string | number>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        f.initialValue ?? (f.type === "select" ? f.options[0] : f.optional ? 0 : 0),
      ]),
    ),
  );

  // 직접 입력 이전값 조회 (pre-fill)
  useEffect(() => {
    axiosInstance
      .get<any, { found: boolean; values: Record<string, any> }>(`/company/activities/${logType}`)
      .then((res) => {
        if (!res?.found) return;
        setValues((prev) => {
          const merged = { ...prev };
          Object.entries(res.values ?? {}).forEach(([k, v]) => {
            if (v != null) merged[k] = v as string | number;
          });
          return merged;
        });
      })
      .catch(() => {});
  }, [logType]);

  const requiredNumberFields = useMemo(
    () => fields.filter((f): f is NumberFieldConfig => f.type === "number" && !f.optional),
    [fields],
  );

  const canSave = useMemo(() => {
    if (mode === "upload") return Boolean(fileName) && !uploadError;
    return requiredNumberFields.every((f) => Number(values[f.name]) > 0);
  }, [fileName, mode, requiredNumberFields, uploadError, values]);

  const selectedUnit = typeof values.unit === "string" ? values.unit : undefined;

  const handleFileUpload = (file?: File) => {
    if (!file) return;
    const isValid = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    setFileName(file.name);
    setUploadError(!isValid);
    uploadFileRef.current = isValid ? file : null;
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (mode === "upload") {
        if (!uploadFileRef.current) return;
        const formData = new FormData();
        formData.append("file", uploadFileRef.current);
        const res = await axiosInstance.post<any, {
          savedCount: number; errorCount: number; errors: UploadRowError[];
        }>(`/company/activities/upload?category=${logType}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.errorCount > 0) {
          setErrorPopup({ savedCount: res.savedCount, errors: res.errors });
        } else {
          navigate("/company/input");
        }
      } else {
        await axiosInstance.post("/company/activities", {
          type: logType, mode, ...values, memo,
        });
        navigate("/company/input");
      }
    } catch (e: any) {
      alert(e?.message ?? "저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-28">
      <CompanyPageHeader title={title} showBack />
      <ModeTabs mode={mode} onChange={setMode} />

      {mode === "manual" ? (
        <>
          {fields.map((field) =>
            field.type === "select" ? (
              <SelectGroup
                key={field.name}
                field={field}
                value={String(values[field.name])}
                onChange={(v) => setValues((p) => ({ ...p, [field.name]: v }))}
              />
            ) : (
              <NumberInput
                key={field.name}
                title={field.title}
                value={Number(values[field.name])}
                unit={selectedUnit ?? field.unit}
                onChange={(v) => setValues((p) => ({ ...p, [field.name]: v }))}
              />
            )
          )}
          <SectionTitle>메모 (선택)</SectionTitle>
          <p className="mt-1 caption2 text-[var(--color-grey-550)]">{memoHelp}</p>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="mt-3 h-32 w-full resize-none rounded-xl border border-[var(--color-grey-250)] bg-white p-4 body2 outline-none focus:border-[var(--color-green)]"
          />
        </>
      ) : (
        <UploadPanel
          logType={logType}
          fileName={fileName}
          hasError={uploadError}
          inputRef={fileInputRef}
          onFileUpload={handleFileUpload}
        />
      )}

      <FixedBottomButton disabled={!canSave || saving} onClick={handleSave}>
        {saving ? "저장 중..." : "저장하기"}
      </FixedBottomButton>

      {/* 업로드 오류 팝업 */}
      {errorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setErrorPopup(null)}
            aria-label="닫기"
          />
          <div className="relative w-[calc(100%-32px)] max-w-[380px] max-h-[70vh] flex flex-col rounded-2xl bg-white shadow-xl">
            <div className="px-5 pt-5 pb-3 border-b border-[var(--color-grey-250)]">
              <p className="title1 text-[var(--color-black)]">업로드 결과</p>
              <p className="mt-1 caption2 text-[var(--color-grey-550)]">
                저장 성공:{" "}
                <span className="text-[var(--color-green)] font-bold">{errorPopup.savedCount}건</span>
                &nbsp;/ 오류:{" "}
                <span className="text-red-500 font-bold">{errorPopup.errors.length}건</span>
              </p>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
              {errorPopup.errors.map((e, i) => (
                <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="caption1 font-bold text-red-600">
                    [{e.sheet}] {e.row}행 · {e.field}
                  </p>
                  <p className="caption2 text-red-500 mt-0.5">{e.reason}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 pt-3 grid grid-cols-2 gap-3">
              {/* 닫기: 오류 상태를 navigate state로 InputPage에 전달 */}
              <button
                type="button"
                onClick={() => {
                  const savedCount = errorPopup.savedCount;
                  const errorCount = errorPopup.errors.length;
                  setErrorPopup(null);
                  navigate("/company/input", {
                    state: { errorLogType: logType, savedCount, errorCount },
                  });
                }}
                className="h-11 rounded-xl bg-[var(--color-grey-150)] label2 text-[var(--color-grey-700)] active:scale-[0.99]"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => setErrorPopup(null)}
                className="h-11 rounded-xl bg-[var(--color-green)] label2 text-white active:scale-[0.99]"
              >
                수정 후 재업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ModeTabs ────────────────────────────────────────────────────────────────
function ModeTabs({ mode, onChange }: { mode: InputMode; onChange: (m: InputMode) => void }) {
  return (
    <div className="mt-8 rounded-full bg-[var(--color-grey-150)] p-1">
      <div className="relative grid grid-cols-2">
        <div
          className={cn(
            "absolute top-0 h-full w-1/2 rounded-full bg-white shadow-sm transition-all duration-200",
            mode === "manual" ? "left-0" : "left-1/2",
          )}
        />
        {(["manual", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={cn(
              "relative z-10 h-10 rounded-full label2 transition-colors",
              mode === m ? "text-[var(--color-dark-green)]" : "text-[var(--color-grey-550)]",
            )}
          >
            {m === "manual" ? "직접 입력" : "파일 업로드"}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── SelectGroup ─────────────────────────────────────────────────────────────
function SelectGroup({ field, value, onChange }: {
  field: SelectFieldConfig; value: string; onChange: (v: string) => void;
}) {
  return (
    <>
      <SectionTitle>{field.title}</SectionTitle>
      <div className={cn("mt-2 grid gap-3", field.columns === 2 ? "grid-cols-2" : "grid-cols-3")}>
        {field.options.map((option) => (
          <SelectButton key={option} active={value === option} onClick={() => onChange(option)}>
            {option}
          </SelectButton>
        ))}
      </div>
    </>
  );
}

// ── SectionTitle ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-9 title1 text-[var(--color-black)]">{children}</h2>;
}

// ── SelectButton ────────────────────────────────────────────────────────────
function SelectButton({ children, active, onClick }: {
  children: React.ReactNode; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-[42px] rounded-lg border px-2 label2 transition-all active:scale-[0.99]",
        active
          ? "border-transparent bg-[var(--color-green)] text-white"
          : "border-[var(--color-grey-250)] bg-white text-[var(--color-grey-650)]",
      )}
    >
      {children}
    </button>
  );
}

// ── NumberInput ─────────────────────────────────────────────────────────────
function NumberInput({ title, value, unit, onChange }: {
  title: string; value: number; unit: string; onChange: (v: number) => void;
}) {
  const [touched, setTouched] = useState(false);
  const isError = touched && value <= 0;

  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <div
        className={cn(
          "mt-2 flex h-[42px] items-center justify-center rounded-lg border bg-white px-4",
          isError ? "border-red-500" : "border-[var(--color-grey-250)]",
        )}
      >
        <input
          type="number"
          value={value || ""}
          onChange={(e) => {
            setTouched(true);
            onChange(Number(e.target.value));
          }}
          className="w-[130px] text-center title1 outline-none"
          placeholder="0"
        />
        <span className="ml-2 label2 text-[var(--color-grey-950)]">{unit}</span>
      </div>
      {isError && (
        <p className="mt-1 caption2 text-red-500">0보다 큰 값을 입력해주세요.</p>
      )}
    </>
  );
}

// ── UploadPanel ─────────────────────────────────────────────────────────────
function UploadPanel({ logType, fileName, hasError, inputRef, onFileUpload }: {
  logType: string;
  fileName: string;
  hasError: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (file?: File) => void;
}) {
  const [history, setHistory] = useState<UploadHistory | null>(null);

  useEffect(() => {
    axiosInstance
      .get<any, { history: UploadHistory[] }>(`/company/activities/excel/history?category=${logType}`)
      .then((res) => { if (res?.history?.length) setHistory(res.history[0]); })
      .catch(() => {});
  }, [logType]);

  return (
    <>
      {/* 마지막 업로드 이력 */}
      {history && (
        <div className="mt-4 rounded-lg bg-[var(--color-grey-150)] px-4 py-2">
          <p className="caption2 text-[var(--color-grey-650)]">
            마지막 업로드: {history.uploadedAt}
            &nbsp;·&nbsp;
            <span className="text-[var(--color-green)]">{history.savedCount}건 성공</span>
            {history.errorCount > 0 && (
              <span className="text-red-500"> / {history.errorCount}건 오류</span>
            )}
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="label2 leading-relaxed text-[var(--color-grey-950)]">
          샘플 양식에 맞춰 엑셀 파일을 업로드해주세요.
        </p>
        <p className="mt-1 caption2 text-[var(--color-grey-550)]">
          * 양식과 다른 파일은 오류가 발생할 수 있습니다.
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        {/* 샘플 다운로드 — fetch로 JWT 포함 */}
        <button
          type="button"
          onClick={async () => {
            try {
              const token = localStorage.getItem("accessToken");
              const res = await fetch(`/api/v1/company/activities/upload/template?category=${logType}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (!res.ok) throw new Error();
              const blob = await res.blob();
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href = url;
              a.download = "탄소배출_입력양식.xlsx";
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              alert("다운로드에 실패했습니다. 다시 시도해주세요.");
            }
          }}
          className="flex h-14 items-center justify-center gap-2 rounded-xl border border-[var(--color-grey-250)] bg-white label2 active:bg-[var(--color-grey-150)] transition-colors"
        >
          <FileDown size={22} />
          샘플 양식 파일 다운로드
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-14 items-center justify-center gap-2 rounded-xl border border-[var(--color-grey-250)] bg-white label2"
        >
          <FileUp size={22} />
          파일 업로드
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => onFileUpload(e.target.files?.[0])}
        />
      </div>

      {/* 업로드 결과 영역 */}
      <div className="mt-5 flex min-h-[160px] items-center justify-center rounded-xl border border-[var(--color-grey-250)] bg-white px-8 py-6 text-center">
        {fileName ? (
          hasError ? (
            <div className="label2 leading-relaxed text-red-600">
              <p>지원하지 않는 파일 형식입니다.</p>
              <p className="mt-1 caption2 text-[var(--color-grey-550)]">
                .xlsx 또는 .xls 파일을 선택해주세요.
              </p>
            </div>
          ) : (
            <div className="label2 leading-relaxed text-[var(--color-grey-950)]">
              <p className="text-[var(--color-green)]">✓ 파일 선택 완료</p>
              <p className="mt-1 caption2 text-[var(--color-grey-550)]">{fileName}</p>
              <p className="mt-2 caption2 text-[var(--color-grey-450)]">
                저장하기를 누르면 업로드됩니다.
              </p>
            </div>
          )
        ) : (
          <p className="body2 text-[var(--color-grey-450)]">
            파일을 선택하면 여기에 표시됩니다.
          </p>
        )}
      </div>
    </>
  );
}

// ── FixedBottomButton ───────────────────────────────────────────────────────
function FixedBottomButton({ children, disabled, onClick }: {
  children: React.ReactNode; disabled?: boolean; onClick: () => void;
}) {
  return (
    <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "h-14 w-full rounded-xl bg-[var(--color-green)] label1 text-white shadow-lg transition-all active:scale-[0.98] hover:brightness-95",
          disabled && "opacity-50",
        )}
      >
        {children}
      </button>
    </div>
  );
}
