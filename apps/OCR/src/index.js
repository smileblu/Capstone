import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import multer from "multer";
import { callClovaOcr } from "./services/clovaOcrService.js";
import {
  classifyCategoryKo,
  joinRawText,
  parseReceiptStructured,
} from "./services/receiptParser.js";

// 항상 apps/OCR/.env 를 로드 (npm 실행 위치가 달라도 동일)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  // eslint-disable-next-line no-console
  console.warn(`[OCR] .env 없음 또는 읽기 실패: ${envPath}`);
  // eslint-disable-next-line no-console
  console.warn("[OCR] apps/OCR/.env.example 를 복사해 CLOVA_OCR_URL / CLOVA_OCR_SECRET 을 채워주세요.");
} else {
  // eslint-disable-next-line no-console
  console.log(`[OCR] env 로드: ${envPath}`);
}

const app = express();

app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * POST /api/ocr
 * - form-data: image=<file>
 */
app.post("/api/ocr", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "No image file uploaded (field name: image)" });
    }

    const mimetype = (req.file.mimetype || "").toLowerCase();
    const original = (req.file.originalname || "").toLowerCase();

    // CLOVA General OCR: jpg, jpeg, png, pdf, tif, tiff (HEIC/WEBP 등은 미지원)
    const isHeic = mimetype.includes("heic") || mimetype.includes("heif") || /\.heic$|\.heif$/i.test(original);
    const isWebp = mimetype.includes("webp") || original.endsWith(".webp");
    if (isHeic || isWebp) {
      return res.status(400).json({
        error: "Unsupported image format",
        message:
          "이 이미지 형식은 CLOVA OCR에서 지원하지 않습니다. JPG/PNG로 저장하거나 (iPhone은 카메라 ‘용량 최적화’ 끄기 / 스크린샷 등) 다시 올려주세요.",
      });
    }

    let format = "jpg";
    if (mimetype.includes("png")) format = "png";
    else if (mimetype.includes("jpeg") || mimetype.includes("jpg")) format = "jpg";
    else if (mimetype.includes("pdf")) format = "pdf";
    else if (mimetype.includes("tif")) format = mimetype.includes("tiff") ? "tiff" : "tif";

    const clova = await callClovaOcr(req.file.buffer, { format });
    const rawText = joinRawText(clova);
    const structured = parseReceiptStructured(rawText);
    const category = classifyCategoryKo(rawText);

    return res.json({
      storeName: structured.storeName,
      date: structured.date,
      items: structured.items,
      amount: structured.amount,
      category,
      rawText,
      amountWon: structured.amount,
      count: 1,
      provider: "clova",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error("[OCR] /api/ocr error:", msg);
    return res.status(500).json({ error: "OCR failed", message: msg });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[OCR] listening on http://localhost:${port}`);
});

