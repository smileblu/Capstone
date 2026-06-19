## 📁 폴더 구조
```
apps/OCR/src
├── index.js                    # Express 서버, /api/ocr 엔드포인트 (Multer로 이미지 수신)
└── services
├── clovaOcrService.js      # CLOVA OCR API 호출
└── receiptParser.js        # OCR 결과 → 영수증 항목 파싱 (Claude 보정 + 규칙 기반 fallback)
```
<br>

## ▶️ 실행
npm install
npm run dev
