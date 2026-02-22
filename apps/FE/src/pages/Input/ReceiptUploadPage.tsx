import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ReceiptUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canRecognize = useMemo(() => Boolean(file), [file]);

  const onPick = (f: File | null) => {
    setFile(f);
    if (!f) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const onRecognize = () => {
    // 더미 OCR
    // 나중에 API 호출해서 결과 받아서 넘기기
    const dummy = {
      storeName: "카페 이화",
      date: "2026-02-01",
      totalAmount: 32000,
      items: [
        { name: "아메리카노", qty: 2, price: 9000 },
        { name: "샌드위치", qty: 1, price: 8500 },
        { name: "쿠키", qty: 1, price: 3500 },
      ],
      category: "카페·음료" as const,
      confidence: 0.78,
    };

    navigate("/personal/input/consumption/receipt/review", {
      state: {
        imageUrl: previewUrl,
        ocr: dummy,
      },
    });
  };

  return (
    <>
      {/* 타이틀 */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 h-10 w-10 rounded-full hover:bg-[var(--color-grey-150)] flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={24} strokeWidth={2} color="var(--color-grey-750)" />
          </button>
          <h1 className="h0 text-[var(--color-dark-green)] tracking-wide">영수증 업로드</h1>
        </div>

        <p className="mt-2 text-center body2 text-[var(--color-grey-550)]">
          영수증 사진을 올리면 소비 항목을 자동으로 분류해요
        </p>
      </div>

      {/* 업로드 카드 */}
      <div className="mt-8 rounded-2xl p-4 bg-[var(--color-grey-150)]">
        <div className="label1 text-var(--color-grey-950)]">영수증 사진</div>

        <div className="mt-3">
          <label
            className="
                mt-3
                w-full h-14
                rounded-2xl border
                flex items-center justify-center gap-3
                cursor-pointer
                bg-white
                hover:bg-[var(--color-grey-50)]
                transition
                label2 text-[var(--color-grey-950)]
            "
            style={{ borderColor: "var(--color-grey-250)" }}
          >
            <Camera className="h-5 w-5 text-[var(--color-grey-750)]" />
            {file ? "영수증 다시 선택" : "영수증 사진 선택"}

            <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                className="hidden"
            />
          </label>
        </div>

        <div className="mt-4">
          {previewUrl ? (
            <img
                src={previewUrl}
                alt="영수증 미리보기"
                className="w-full rounded-xl border"
                style={{ borderColor: "var(--color-grey-250)" }}
            />
          ) : (
            <div
                className="
                w-full h-40 rounded-xl border
                flex flex-col items-center justify-center gap-2
                caption2 [var(--color-grey-550)]
                bg-white
                "
                style={{ borderColor: "var(--color-grey-250)" }}
            >
                <span className="text-2xl" aria-hidden="true">🧾</span>
                업로드한 영수증이 여기에 표시돼요
            </div>
          )}
        </div>
      </div>

      {/* 인식하기 버튼 */}
      <div className="fixed bottom-[calc(70px+18px)] left-1/2 z-40 w-[402px] -translate-x-1/2 px-5">
        <p className="text-center caption2 text-[var(--color-grey-450)] mb-4 animate-in fade-in duration-500">
            * 인식 결과는 저장 전에 수정할 수 있어요
        </p>
        
        <button
            type="button"
            disabled={!canRecognize}
            onClick={onRecognize}
            className={cn(
            "h-14 w-full rounded-2xl label1 text-white shadow-lg transition-all active:scale-[0.98]",
            !canRecognize ? "bg-[var(--color-pale-green)]" : "bg-[var(--color-green)]"
            )}
        >
            인식하기
        </button>
      </div>

      <div className="h-40" />
    </>
  );
}
