const AMOUNT_REGEX = /(\d{1,3}(?:,\d{3})*|\d+)\s*원/g;

/** CLOVA field 배열 → 읽기 좋은 본문 (줄 단위 분석을 위해 줄바꿈으로 이어붙임) */
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

/** 합계/결제 등 라인에서 숫자만 추출 (원 단위) */
const EXCLUDE_LINE =
  /합계|총액|부가세|결제|받은|거스름|할인|포인트|카드승인|현금|VAT|부가가치세|영수증|거래일시|사업자|Tel|tel|주소/i;

const DATE_LINE =
  /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/;

/**
 * 본문에서 첫 번째 날짜 패턴 (YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD, 선택적 시각)
 * 표시용 문자열로 정규화 (YYYY-MM-DD 또는 YYYY-MM-DD HH:mm)
 */
export function extractDate(rawText) {
  const text = (rawText || "").replace(/\r\n/g, "\n");
  const m = text.match(
    /(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/
  );
  if (!m) return "";
  const y = m[1];
  const mo = m[2].padStart(2, "0");
  const d = m[3].padStart(2, "0");
  if (m[4] !== undefined && m[5] !== undefined) {
    return `${y}-${mo}-${d} ${m[4]}:${m[5]}`;
  }
  return `${y}-${mo}-${d}`;
}

function normalizeLines(rawText) {
  return (rawText || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

/**
 * 상호: 날짜 전용 줄·숫자만 줄·품목으로 보이는 줄을 제외하고 앞쪽에서 후보 선택
 */
export function extractStoreName(lines) {
  for (const line of lines) {
    if (!line) continue;
    if (DATE_LINE.test(line)) continue;
    if (/^[\d\s,원₩]+$/.test(line)) continue;
    if (EXCLUDE_LINE.test(line)) continue;
    if (tryParseItemLine(line)) continue;
    if (line.length >= 2) return line;
  }
  return "미확인";
}

/** 한 줄이 "품목명 + 가격" 형태면 파싱, 아니면 null */
function tryParseItemLine(line) {
  const t = line.trim();
  if (!t || EXCLUDE_LINE.test(t)) return null;
  if (!/\d/.test(t)) return null;

  const withWon = t.match(/^(.+?)[\s]+([\d,]+)\s*원\s*$/);
  if (withWon) {
    const name = withWon[1].trim();
    const price = Number(String(withWon[2]).replace(/,/g, ""));
    if (name && Number.isFinite(price) && price > 0) return { name, price };
  }

  const noWon = t.match(/^(.+?)[\s]+([\d,]+)\s*$/);
  if (noWon) {
    const name = noWon[1].trim();
    const price = Number(String(noWon[2]).replace(/,/g, ""));
    if (name && !EXCLUDE_LINE.test(name) && Number.isFinite(price) && price > 0) {
      return { name, price };
    }
  }

  return null;
}

/**
 * 품목: 숫자(가격) 포함, 합계/부가세 등 키워드 줄 제외
 */
export function extractLineItems(lines) {
  const items = [];
  for (const line of lines) {
    if (EXCLUDE_LINE.test(line)) continue;
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
 * 총액: (1) "N원" 중 최대값 (2) 품목가 합 (3) 0
 */
export function resolveAmount(rawText, items) {
  let maxWon = extractMaxAmountWon(rawText);
  if (maxWon > 0) return maxWon;
  const sum = items.reduce((s, i) => s + (i.price || 0), 0);
  if (sum > 0) return sum;
  const nums = (rawText || "").match(/(\d{1,3}(?:,\d{3})*|\d+)/g);
  if (nums && nums.length) {
    let m = 0;
    for (const x of nums) {
      const n = Number(String(x).replace(/,/g, ""));
      if (Number.isFinite(n) && n > m) m = n;
    }
    return m;
  }
  return 0;
}

/**
 * rawText → 상호, 날짜, 품목, 금액
 */
export function parseReceiptStructured(rawText) {
  const lines = normalizeLines(rawText);
  const date = extractDate(rawText);
  const storeName = extractStoreName(lines);
  let items = extractLineItems(lines);
  let amount = resolveAmount(rawText, items);

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
 * rule-based 소비 카테고리 분류
 * 반환값은 FE에서 쓰는 한국어 라벨(ReceiptReviewPage의 Category)로 맞춤
 */
export function classifyCategoryKo(rawText) {
  const t = (rawText || "").toLowerCase();

  const hasAny = (keywords) => keywords.some((k) => t.includes(k.toLowerCase()));

  if (hasAny(["배달의민족", "요기요", "쿠팡이츠", "coupang eats", "우아한형제들"])) return "배달 음식";
  if (hasAny(["스타벅스", "투썸플레이스", "이디야", "커피", "cafe", "카페"])) return "카페·음료";
  if (hasAny(["식당", "고기", "국밥", "분식", "한식", "중식", "레스토랑"])) return "외식";
  if (hasAny(["zara", "h&m", "무신사", "옷", "패션"])) return "의류·패션";

  return "기타";
}
