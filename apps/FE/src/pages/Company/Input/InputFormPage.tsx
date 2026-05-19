import { useMemo, useRef, useState } from "react";
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

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function InputFormPage({
  title,
  logType,
  fields,
  memoHelp,
}: InputFormPageProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<InputMode>("manual");
  const [memo, setMemo] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [values, setValues] = useState<Record<string, string | number>>(() =>
    Object.fromEntries(
      fields.map((field) => [
        field.name,
        field.initialValue ??
          (field.type === "select" ? field.options[0] : field.optional ? 0 : 1),
      ]),
    ),
  );

  const requiredNumberFields = useMemo(
    () =>
      fields.filter(
        (field): field is NumberFieldConfig =>
          field.type === "number" && !field.optional,
      ),
    [fields],
  );

  const canSave = useMemo(() => {
    if (mode === "upload") return Boolean(fileName) && !uploadError;
    return requiredNumberFields.every((field) => Number(values[field.name]) > 0);
  }, [fileName, mode, requiredNumberFields, uploadError, values]);

  const selectedUnit =
    typeof values.unit === "string" ? values.unit : undefined;

  const handleFileUpload = (file?: File) => {
    if (!file) return;

    const isValid =
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".csv");

    setFileName(file.name);
    setUploadError(!isValid);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await axiosInstance.post("/company/activities", {
        type: logType,
        mode,
        ...values,
        memo,
        fileName: mode === "upload" ? fileName : undefined,
      });
      navigate("/company/input");
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
                onChange={(nextValue) =>
                  setValues((prev) => ({ ...prev, [field.name]: nextValue }))
                }
              />
            ) : (
              <NumberInput
                key={field.name}
                title={field.title}
                value={Number(values[field.name])}
                unit={selectedUnit ?? field.unit}
                onChange={(nextValue) =>
                  setValues((prev) => ({ ...prev, [field.name]: nextValue }))
                }
              />
            ),
          )}

          <SectionTitle>메모 (선택)</SectionTitle>
          <p className="mt-1 caption2 text-[var(--color-grey-550)]">
            {memoHelp}
          </p>
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            className="mt-3 h-32 w-full resize-none rounded-xl border border-[var(--color-grey-250)] bg-white p-4 body2 outline-none focus:border-[var(--color-green)]"
          />
        </>
      ) : (
        <UploadPanel
          fileName={fileName}
          hasError={uploadError}
          inputRef={fileInputRef}
          onFileUpload={handleFileUpload}
        />
      )}

      <FixedBottomButton disabled={!canSave || saving} onClick={handleSave}>
        {saving ? "저장 중..." : "저장하기"}
      </FixedBottomButton>
    </div>
  );
}

function ModeTabs({
  mode,
  onChange,
}: {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}) {
  return (
    <div className="mt-8 rounded-full bg-[var(--color-grey-150)] p-1">
      <div className="relative grid grid-cols-2">
        <div
          className={cn(
            "absolute top-0 h-full w-1/2 rounded-full bg-white shadow-sm transition-all duration-200",
            mode === "manual" ? "left-0" : "left-1/2",
          )}
        />
        <button
          type="button"
          onClick={() => onChange("manual")}
          className={cn(
            "relative z-10 h-10 rounded-full label2 transition-colors",
            mode === "manual"
              ? "text-[var(--color-dark-green)]"
              : "text-[var(--color-grey-550)]",
          )}
        >
          직접 입력
        </button>
        <button
          type="button"
          onClick={() => onChange("upload")}
          className={cn(
            "relative z-10 h-10 rounded-full label2 transition-colors",
            mode === "upload"
              ? "text-[var(--color-dark-green)]"
              : "text-[var(--color-grey-550)]",
          )}
        >
          파일 업로드
        </button>
      </div>
    </div>
  );
}

function SelectGroup({
  field,
  value,
  onChange,
}: {
  field: SelectFieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <SectionTitle>{field.title}</SectionTitle>
      <div
        className={cn(
          "mt-2 grid gap-3",
          field.columns === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {field.options.map((option) => (
          <SelectButton
            key={option}
            active={value === option}
            onClick={() => onChange(option)}
          >
            {option}
          </SelectButton>
        ))}
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-9 title1 text-[var(--color-black)]">{children}</h2>;
}

function SelectButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
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

function NumberInput({
  title,
  value,
  unit,
  onChange,
}: {
  title: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-2 flex h-[42px] items-center justify-center rounded-lg border border-[var(--color-grey-250)] bg-white px-4">
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-[130px] text-center title1 outline-none"
          placeholder="0"
        />
        <span className="ml-2 label2 text-[var(--color-grey-950)]">
          {unit}
        </span>
      </div>
    </>
  );
}

function UploadPanel({
  fileName,
  hasError,
  inputRef,
  onFileUpload,
}: {
  fileName: string;
  hasError: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (file?: File) => void;
}) {
  return (
    <>
      <div className="mt-8 text-center">
        <p className="label2 leading-relaxed text-[var(--color-grey-950)]">
          샘플 양식에 맞춰 엑셀 또는 CSV 파일을 업로드해주세요.
        </p>
        <p className="mt-1 caption2 text-[var(--color-grey-550)]">
          * 양식과 다른 파일은 오류가 발생할 수 있습니다.
        </p>
      </div>
      <div className="mt-4 grid gap-4">
        <button
          type="button"
          onClick={() => alert("샘플 양식 파일 다운로드")}
          className="flex h-14 items-center justify-center gap-2 rounded-xl border border-[var(--color-grey-250)] bg-white label2"
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
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(event) => onFileUpload(event.target.files?.[0])}
        />
      </div>
      <div className="mt-5 flex h-[410px] items-center justify-center rounded-xl border border-[var(--color-grey-250)] bg-white px-8 text-center">
        {fileName ? (
          hasError ? (
            <div className="label2 leading-relaxed text-[var(--color-grey-950)]">
              <p>[업로드 결과]</p>
              <p className="mt-1">오류가 확인되었습니다.</p>
              <p>확인 후 다시 업로드해주세요.</p>
            </div>
          ) : (
            <div className="label2 leading-relaxed text-[var(--color-grey-950)]">
              <p>[업로드 결과]</p>
              <p className="mt-1">{fileName}</p>
              <p>파일이 정상적으로 업로드되었습니다.</p>
            </div>
          )
        ) : (
          <p className="body2 text-[var(--color-grey-550)]">
            업로드한 파일의 검증 결과가 표시됩니다.
          </p>
        )}
      </div>
    </>
  );
}

function FixedBottomButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
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
