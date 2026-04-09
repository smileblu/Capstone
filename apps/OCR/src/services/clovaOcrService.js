import axios from "axios";

function requireEnv(name) {
  const v = process.env[name];
  const trimmed = typeof v === "string" ? v.trim() : "";
  if (!trimmed) {
    throw new Error(`Missing required env: ${name}`);
  }
  return trimmed;
}

/** .env 복붙 시 따옴표·제로폭·줄바꿈이 섞이면 axios가 "Invalid URL"을 냄 */
function sanitizeUrl(raw) {
  let s = String(raw).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  s = s.replace(/\s+/g, "");
  return s;
}

function assertValidHttpUrl(url, envName) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("bad protocol");
    }
  } catch {
    throw new Error(
      `${envName} 형식이 잘못되었습니다. 네이버 클라우드 콘솔 OCR 도메인의 Invoke URL 전체를 ` +
        `https:// 로 시작하는 한 줄로 넣어주세요. (따옴표·줄바꿈·공백 없이, 끝에 /general 까지 포함)`
    );
  }
}

function formatAxiosError(err) {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : String(err);
  }
  const status = err.response?.status;
  const data = err.response?.data;
  let body;
  try {
    body = typeof data === "string" ? data : JSON.stringify(data ?? {});
  } catch {
    body = String(data);
  }
  return `CLOVA OCR 요청 실패 (HTTP ${status ?? "no-status"}): ${body || err.message}`;
}

/**
 * CLOVA OCR "General" API (v2) 호출.
 * - 입력: imageBuffer (multer memoryStorage)
 * - 출력: CLOVA 원본 응답 JSON
 */
export async function callClovaOcr(imageBuffer, { format = "jpg" } = {}) {
  const url = sanitizeUrl(requireEnv("CLOVA_OCR_URL"));
  assertValidHttpUrl(url, "CLOVA_OCR_URL");
  const secret = requireEnv("CLOVA_OCR_SECRET");
  const version = (process.env.CLOVA_OCR_VERSION || "V2").trim();

  const base64 = imageBuffer.toString("base64");
  const timestamp = Date.now();

  const body = {
    version,
    requestId: `req-${timestamp}`,
    timestamp,
    images: [
      {
        format,
        name: "receipt",
        data: base64,
      },
    ],
  };

  try {
    const res = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-OCR-SECRET": secret,
      },
      timeout: 20_000,
      validateStatus: () => true,
    });

    // CLOVA는 HTTP 200이어도 본문에 오류 코드를 담는 경우가 있음
    const payload = res.data;
    const code = payload?.code ?? payload?.status;
    if (code != null && String(code) !== "200") {
      const msg =
        payload?.message ||
        payload?.error ||
        (typeof payload === "object" ? JSON.stringify(payload) : String(payload));
      throw new Error(`CLOVA OCR 응답 오류 (code=${code}): ${msg}`);
    }

    if (res.status < 200 || res.status >= 300) {
      throw new Error(
        `CLOVA OCR HTTP ${res.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload ?? {})}`
      );
    }

    return payload;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Invalid URL" || msg.includes("Invalid URL")) {
      throw new Error(
        `CLOVA_OCR_URL 파싱 실패(Invalid URL). apps/OCR/.env 에 Invoke URL 을 ` +
          `따옴표 없이 한 줄로 넣었는지, https:// 로 시작하는지 확인하세요.`
      );
    }
    throw new Error(formatAxiosError(err));
  }
}

