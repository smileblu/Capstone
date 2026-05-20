// 원 단위 금액 패턴 (1,000원 / 1000원)
const AMOUNT_REGEX = /(\d{1,3}(?:,\d{3})*|\d+)\s*원/g;

// 총액/합계 키워드 줄
const TOTAL_LINE = /합계|총액|총\s*금액|결제\s*금액|받을\s*금액|청구\s*금액|최종\s*금액|실\s*결제|합\s*계/;

const EXCLUDE_LINE =
  /부가세|거스름|할인|포인트|카드승인|현금|VAT|부가가치세|영수증|거래일시|사업자|Tel|tel|주소|대표|사업자번호|전화|팩스|가맹점|승인번호|취소|회원번호|서명/i;

const DATE_LINE =
  /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/;

/** CLOVA field 배열 → 읽기 좋은 본문 (줄바꿈으로 이어붙임) */
export function joinRawText(clovaJson) {
  const fields = clovaJson?.images?.[0]?.fields;
  if (!Array.isArray(fields)) return "";

  return fields
    .map((f) => (typeof f?.inferText === "string" ? f.inferText.trim() : ""))
    .filter(Boolean)
    .join("\n");
}

export function extractMaxAmountWon(rawText) {
  const matches = rawText.matchAll(AMOUNT_REGEX);
  let max = 0;
  for (const m of matches) {
    const n = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

/**
 * 합계/결제금액 키워드 줄에서 금액을 우선 추출.
 */
function extractTotalFromKeywordLine(lines) {
  for (const line of lines) {
    if (!TOTAL_LINE.test(line)) continue;
    const wonMatch = line.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*원/);
    if (wonMatch) return Number(wonMatch[1].replace(/,/g, ""));
    const numMatch = line.match(/(\d{1,3}(?:,\d{3})*|\d+)/);
    if (numMatch) return Number(numMatch[1].replace(/,/g, ""));
  }
  return 0;
}

/**
 * 날짜 파싱 — 숫자 구분자 + 한국어 형식 + 2자리 연도 지원
 */
export function extractDate(rawText) {
  const text = (rawText || "").replace(/\r\n/g, "\n");

  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD (선택적 시각)
  const mSep = text.match(
    /(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/
  );
  if (mSep) {
    const [, y, mo, d, h, mi] = mSep;
    const date = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return h !== undefined ? `${date} ${h}:${mi}` : date;
  }

  // YYYY년 MM월 DD일 (선택적 시각)
  const mKo = text.match(
    /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일(?:\s*(\d{1,2})\s*시\s*(\d{2})\s*분)?/
  );
  if (mKo) {
    const [, y, mo, d, h, mi] = mKo;
    const date = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return h !== undefined ? `${date} ${h}:${mi}` : date;
  }

  // YY.MM.DD 형식 (2자리 연도 → 20xx)
  const mShort = text.match(/(\d{2})[./](\d{1,2})[./](\d{1,2})/);
  if (mShort) {
    const [, y2, mo, d] = mShort;
    return `20${y2}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return "";
}

function normalizeLines(rawText) {
  return (rawText || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

/**
 * 상호명: 날짜·숫자·제외 키워드·품목·전화번호 줄 제외 후 앞쪽에서 후보 선택.
 */
export function extractStoreName(lines) {
  const candidates = lines.slice(0, 15);
  for (const line of candidates) {
    if (!line) continue;
    if (DATE_LINE.test(line)) continue;
    if (/^[\d\s,원₩./-]+$/.test(line)) continue;
    if (EXCLUDE_LINE.test(line)) continue;
    if (TOTAL_LINE.test(line)) continue;
    if (tryParseItemLine(line)) continue;
    // 전화번호 패턴
    if (/\d{2,4}-\d{3,4}-\d{4}/.test(line)) continue;
    if (line.length >= 2) return line;
  }
  return "미확인";
}

/**
 * 한 줄이 "품목명 + 가격" 형태면 파싱, 아니면 null.
 * 지원 패턴:
 *   아메리카노 4,500원
 *   아메리카노 4500
 *   아메리카노 2 × 4,500  (수량 × 단가)
 *   아메리카노 x2 4,500
 */
function tryParseItemLine(line) {
  const t = line.trim();
  if (!t || EXCLUDE_LINE.test(t) || TOTAL_LINE.test(t)) return null;
  if (!/\d/.test(t)) return null;

  // 수량 × 단가 패턴
  const qtyUnit = t.match(/^(.+?)\s+(?:x|×|\*)\s*(\d+)\s+([\d,]+)\s*원?\s*$/i);
  if (qtyUnit) {
    const name = qtyUnit[1].trim();
    const qty = Number(qtyUnit[2]);
    const unit = Number(String(qtyUnit[3]).replace(/,/g, ""));
    if (name && qty > 0 && Number.isFinite(unit) && unit > 0) {
      return { name, price: qty * unit };
    }
  }

  // "상품명 수량 단가" 패턴 (수량 1~99, 단가 100원 이상)
  const nameQtyPrice = t.match(/^(.+?)\s+(\d+)\s+([\d,]+)\s*원?\s*$/);
  if (nameQtyPrice) {
    const name = nameQtyPrice[1].trim();
    const qty = Number(nameQtyPrice[2]);
    const unit = Number(String(nameQtyPrice[3]).replace(/,/g, ""));
    if (name && qty >= 1 && qty <= 99 && Number.isFinite(unit) && unit >= 100) {
      return { name, price: qty * unit };
    }
  }

  // "상품명 가격원"
  const withWon = t.match(/^(.+?)\s+([\d,]+)\s*원\s*$/);
  if (withWon) {
    const name = withWon[1].trim();
    const price = Number(String(withWon[2]).replace(/,/g, ""));
    if (name && Number.isFinite(price) && price > 0) return { name, price };
  }

  // "상품명 가격" (원 없음, 100원 이상)
  const noWon = t.match(/^(.+?)\s+([\d,]+)\s*$/);
  if (noWon) {
    const name = noWon[1].trim();
    const price = Number(String(noWon[2]).replace(/,/g, ""));
    if (
      name &&
      !EXCLUDE_LINE.test(name) &&
      !TOTAL_LINE.test(name) &&
      Number.isFinite(price) &&
      price >= 100
    ) {
      return { name, price };
    }
  }

  return null;
}

/** 품목 추출: 합계/제외 키워드 줄 건너뜀 */
export function extractLineItems(lines) {
  const items = [];
  for (const line of lines) {
    if (EXCLUDE_LINE.test(line)) continue;
    if (TOTAL_LINE.test(line)) continue;
    const it = tryParseItemLine(line);
    if (it) items.push(it);
  }
  return dedupeItems(items);
}

function dedupeItems(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = `${it.name}|${it.price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/**
 * 총액 결정:
 * 1) 합계/결제금액 키워드 줄의 숫자
 * 2) rawText에서 "N원" 중 최대값
 * 3) 품목가 합계
 * 4) 0
 */
export function resolveAmount(rawText, items, lines) {
  const fromKeyword = lines ? extractTotalFromKeywordLine(lines) : 0;
  if (fromKeyword > 0) return fromKeyword;

  const maxWon = extractMaxAmountWon(rawText);
  if (maxWon > 0) return maxWon;

  const sum = items.reduce((s, i) => s + (i.price || 0), 0);
  if (sum > 0) return sum;

  return 0;
}

// ── LLM 기반 파싱 (Claude API) ────────────────────────────────────────────

const RECEIPT_SYSTEM_PROMPT =
  `너는 영수증 파서다. 아래 규칙을 반드시 따라라:
- 반드시 JSON만 출력하고, 마크다운 코드블록(\`\`\`)이나 설명 텍스트는 절대 포함하지 않는다.
- storeName은 영수증 최상단의 매장명을 추출하되, 불분명하면 "미확인"으로 한다.
- date는 영수증에서 결제일시를 찾아 "YYYY-MM-DD" 형식으로 반환한다. 없으면 "".
- amount는 합계/결제금액/총액 등 최종 지불 금액으로 한다. 부가세·할인 전 금액과 혼동하지 않는다.
- items는 품목명과 개별 가격 쌍의 배열이며, 합계 줄은 포함하지 않는다.
- category는 매장명과 품목을 종합해서 "배달 음식" | "카페·음료" | "외식" | "의류·패션" | "기타" 중 하나로만 분류한다.`;

function _buildReceiptUserPrompt(rawText) {
  return `아래는 영수증 OCR 결과 텍스트야. 파싱해줘:\n"""\n${rawText}\n"""`;
}

function _validateReceiptResult(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.storeName !== "string") return false;
  if (typeof obj.date !== "string") return false;
  if (!Array.isArray(obj.items)) return false;
  if (typeof obj.amount !== "number") return false;
  if (typeof obj.category !== "string") return false;
  if (obj.amount < 0) return false;
  return true;
}

export async function parseReceiptWithLLM(rawText) {
  const apiKey = (process.env.CLAUDE_API_KEY || "").trim();
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.warn("[OCR] CLAUDE_API_KEY 미설정 → rule-based fallback 사용");
    return null;
  }

  const model = (process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001").trim();
  const baseUrl = (process.env.CLAUDE_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  const timeoutMs = Number(process.env.CLAUDE_TIMEOUT_SEC || 20) * 1000;

  // eslint-disable-next-line no-console
  console.log(`[OCR] Claude 호출 시작 (model: ${model})`);

  const payload = {
    model,
    max_tokens: 1024,
    system: RECEIPT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: _buildReceiptUserPrompt(rawText) }],
  };
  const headers = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let res;
      try {
        res = await fetch(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        // eslint-disable-next-line no-console
        console.warn(`[OCR] Claude HTTP ${res.status} (attempt ${attempt + 1}):`, errText.slice(0, 200));
        continue;
      }

      const data = await res.json();
      const raw = ((data.content || [{}])[0]?.text || "").trim();

      if (!raw) {
        // eslint-disable-next-line no-console
        console.warn(`[OCR] Claude 응답 텍스트 없음 (attempt ${attempt + 1})`);
        continue;
      }

      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();

      let obj;
      try {
        obj = JSON.parse(cleaned);
      } catch {
        // eslint-disable-next-line no-console
        console.warn(`[OCR] Claude JSON 파싱 실패 (attempt ${attempt + 1}):`, cleaned.slice(0, 200));
        continue;
      }

      if (_validateReceiptResult(obj)) {
        // eslint-disable-next-line no-console
        console.log("[OCR] Claude 파싱 성공:", JSON.stringify(obj).slice(0, 200));
        return obj;
      }
      // eslint-disable-next-line no-console
      console.warn(`[OCR] Claude 결과 검증 실패 (attempt ${attempt + 1}):`, obj);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[OCR] Claude 호출 오류 (attempt ${attempt + 1}):`, err?.message || err);
    }
  }

  // eslint-disable-next-line no-console
  console.warn("[OCR] Claude 3회 모두 실패 → rule-based fallback");
  return null;
}

export async function parseReceiptHybrid(rawText) {
  const llmResult = await parseReceiptWithLLM(rawText);
  if (llmResult !== null) return { ...llmResult, _provider: "llm" };

  const structured = parseReceiptStructured(rawText);
  const category = classifyCategoryKo(rawText);
  return { ...structured, category, _provider: "rule-based" };
}

// ── Rule-based 파싱 ─────────────────────────────────────────────────────────

/** rawText → 상호, 날짜, 품목, 금액 */
export function parseReceiptStructured(rawText) {
  const lines = normalizeLines(rawText);
  const date = extractDate(rawText);
  const storeName = extractStoreName(lines);
  let items = extractLineItems(lines);
  let amount = resolveAmount(rawText, items, lines);

  if (items.length === 0 && amount > 0) {
    items = [{ name: "상품", price: amount }];
  }

  return {
    storeName: storeName || "미확인",
    date,
    items,
    amount,
  };
}

/**
 * rule-based 소비 카테고리 분류.
 * 반환값은 FE ReceiptReviewPage의 Category 라벨 기준.
 */
export function classifyCategoryKo(rawText) {
  const t = (rawText || "").toLowerCase();
  const hasAny = (keywords) => keywords.some((k) => t.includes(k.toLowerCase()));

  if (hasAny([
    "배달의민족", "요기요", "쿠팡이츠", "coupang eats", "우아한형제들",
    "배달", "딜리버리", "배달비",
  ])) return "배달 음식";

  if (hasAny([
    "스타벅스", "투썸플레이스", "이디야", "커피빈", "할리스", "폴바셋", "파스쿠찌",
    "메가커피", "컴포즈", "빽다방", "더카페", "cafe", "카페", "coffee",
    "음료", "라떼", "아메리카노", "에스프레소", "버블티", "smoothie",
  ])) return "카페·음료";

  if (hasAny([
    "식당", "고기", "국밥", "분식", "한식", "중식", "일식", "양식", "레스토랑",
    "restaurant", "갈비", "삼겹살", "치킨", "피자", "햄버거", "burger", "pizza",
    "chicken", "mcdonald", "롯데리아", "kfc", "맘스터치", "서브웨이", "subway",
    "편의점", "cu ", "gs25", "seven eleven", "세븐일레븐", "미니스톱", "emart24",
  ])) return "외식";

  if (hasAny([
    "zara", "h&m", "무신사", "옷", "패션", "의류",
    "nike", "adidas", "uniqlo", "유니클로", "spao", "탑텐",
    "신발", "가방", "악세사리",
  ])) return "의류·패션";

  return "기타";
}
