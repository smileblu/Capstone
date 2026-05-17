import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileDown, FileUp } from "lucide-react";

type InputMode = "manual" | "upload";
type MobileType = "vehicle" | "logistics";

type VehicleType = "승합차" | "화물차" | "승용차";
type FuelType = "휘발유" | "경유" | "등유";
type LogisticsType = "택배" | "화물";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function MobileCombustionInputPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<InputMode>("manual");
  const [mobileType, setMobileType] = useState<MobileType>("vehicle");

  const [vehicleType, setVehicleType] = useState<VehicleType>("승합차");
  const [fuelType, setFuelType] = useState<FuelType>("경유");
  const [distanceKm, setDistanceKm] = useState<number>(320);
  const [fuelUsed, setFuelUsed] = useState<number>(40);

  const [logisticsType, setLogisticsType] = useState<LogisticsType>("택배");
  const [weightTon, setWeightTon] = useState<number>(2);

  const [memo, setMemo] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadError, setUploadError] = useState(false);

  const canSave = useMemo(() => {
    if (mode === "upload") return Boolean(fileName) && !uploadError;
    if (mobileType === "vehicle") return distanceKm > 0;
    return distanceKm > 0;
  }, [mode, mobileType, distanceKm, fileName, uploadError]);

  const handleSave = () => {
    if (!canSave) return;

    console.log({
      type: "BUSINESS_MOBILE_COMBUSTION",
      mode,
      mobileType,
      vehicleType,
      fuelType,
      distanceKm,
      fuelUsed,
      logisticsType,
      weightTon,
      memo,
      fileName,
    });

    navigate("/business/input");
  };

  const handleFileUpload = (file?: File) => {
    if (!file) return;

    const isValid =
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".csv");

    setFileName(file.name);
    setUploadError(!isValid);
  };

  return (
    <div className="pb-28">
      <div className="pt-2">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-grey-150)]"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={24} color="var(--color-grey-750)" />
          </button>

          <h1 className="h0 text-[var(--color-dark-green)]">이동 연소 입력</h1>
        </div>
      </div>

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
            onClick={() => setMode("manual")}
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
            onClick={() => setMode("upload")}
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

      {mode === "manual" ? (
        <>
          <SectionTitle>입력 기준</SectionTitle>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <SelectButton
              active={mobileType === "vehicle"}
              onClick={() => setMobileType("vehicle")}
            >
              차량 기준
            </SelectButton>
            <SelectButton
              active={mobileType === "logistics"}
              onClick={() => setMobileType("logistics")}
            >
              물류 기준
            </SelectButton>
          </div>

          {mobileType === "vehicle" ? (
            <>
              <SectionTitle>차량 종류</SectionTitle>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {(["승합차", "화물차", "승용차"] as VehicleType[]).map((item) => (
                  <SelectButton
                    key={item}
                    active={vehicleType === item}
                    onClick={() => setVehicleType(item)}
                  >
                    {item}
                  </SelectButton>
                ))}
              </div>

              <SectionTitle>연료 종류</SectionTitle>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {(["휘발유", "경유", "등유"] as FuelType[]).map((item) => (
                  <SelectButton
                    key={item}
                    active={fuelType === item}
                    onClick={() => setFuelType(item)}
                  >
                    {item}
                  </SelectButton>
                ))}
              </div>

              <NumberInput
                title="이동 거리"
                value={distanceKm}
                unit="km"
                onChange={setDistanceKm}
              />

              <NumberInput
                title="연료 사용량 (선택)"
                value={fuelUsed}
                unit="L"
                onChange={setFuelUsed}
              />
            </>
          ) : (
            <>
              <SectionTitle>물류 종류</SectionTitle>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["택배", "화물"] as LogisticsType[]).map((item) => (
                  <SelectButton
                    key={item}
                    active={logisticsType === item}
                    onClick={() => setLogisticsType(item)}
                  >
                    {item}
                  </SelectButton>
                ))}
              </div>

              <NumberInput
                title="이동 거리"
                value={distanceKm}
                unit="km"
                onChange={setDistanceKm}
              />

              <NumberInput
                title="중량 (선택)"
                value={weightTon}
                unit="ton"
                onChange={setWeightTon}
              />
            </>
          )}

          <SectionTitle>메모 (선택)</SectionTitle>

          <p className="mt-1 caption2 text-[var(--color-grey-550)]">
            차량 운행 또는 물류 이동의 근거를 기록해주세요.
          </p>

          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="mt-3 h-32 w-full resize-none rounded-xl border border-[var(--color-grey-250)] bg-white p-4 body2 outline-none focus:border-[var(--color-green)]"
          />
        </>
      ) : (
        <>
          <div className="mt-8 text-center">
            <p className="label2 leading-relaxed text-[var(--color-grey-950)]">
              샘플 양식에 맞춰
              <br />
              엑셀 / CSV 파일 형태로 업로드해주세요
            </p>
            <p className="mt-1 caption2 text-[var(--color-grey-550)]">
              * 양식과 다른 형식의 파일은 오류가 발생할 수 있습니다.
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            <button
              type="button"
              onClick={() => alert("샘플 양식 파일 다운로드")}
              className="flex h-16 items-center justify-center gap-2 rounded-xl border border-[var(--color-grey-250)] bg-white label2"
            >
              <FileDown size={22} />
              샘플 양식 파일 다운로드
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-16 items-center justify-center gap-2 rounded-xl border border-[var(--color-grey-250)] bg-white label2"
            >
              <FileUp size={22} />
              파일 업로드
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
            />
          </div>

          <div className="mt-5 flex h-[410px] items-center justify-center rounded-xl border border-[var(--color-grey-250)] bg-white px-8 text-center">
            {fileName ? (
              uploadError ? (
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
      )}

      <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className={cn(
            "h-14 w-full rounded-xl bg-[var(--color-green)] label1 text-white transition-all active:scale-[0.98]",
            !canSave && "opacity-50",
          )}
        >
          저장하기
        </button>
      </div>
    </div>
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
        "h-[42px] rounded-lg border label2",
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
          onChange={(e) => onChange(Number(e.target.value))}
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