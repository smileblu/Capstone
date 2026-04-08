import axios from "axios";

export type OcrCategoryKo = "배달 음식" | "외식" | "카페·음료" | "의류·패션" | "기타";

export type OcrLineItem = { name: string; price: number };

/** POST /api/ocr 성공 응답 (구조화 + 기존 필드 호환) */
export type OcrResult = {
  storeName: string;
  date: string;
  items: OcrLineItem[];
  amount: number;
  category: OcrCategoryKo;
  rawText: string;
  /** 하위 호환 */
  amountWon: number;
  count: number;
  provider: string;
};

/** 서버(Express) / 프록시 오류 응답에서 사용자용 문구 추출 */
export function getOcrErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { message?: string; error?: string } | undefined;
    if (d?.message) return d.message;
    if (d?.error && typeof d.error === "string") return d.error;
    if (e.response?.status) return `서버 오류 (${e.response.status}). OCR 터미널 로그를 확인해 주세요.`;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

export async function runReceiptOcr(image: File): Promise<OcrResult> {
  const form = new FormData();
  form.append("image", image);

  const res = await axios.post<OcrResult>("/api/ocr", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30_000,
  });
  return res.data;
}
