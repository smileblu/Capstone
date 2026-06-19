## 📁 폴더 구조
```
apps/AI
├── main.py            # FastAPI 엔트리포인트 — 예측/시나리오/리포트 생성 API
├── forecast.py        # ARIMA/SARIMA 기반 시계열 예측 로직
├── anomaly.py         # Z-score 기반 이상치 탐지·보간
├── anomaly_types.py   # 이상치 탐지 결과 타입 정의
└── requirements.txt
```
<br>

## ▶️ 실행
```
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
