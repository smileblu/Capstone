FROM python:3.12-slim

WORKDIR /app

# 시스템 의존성 (numpy, scipy, statsmodels 빌드에 필요)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 패키지 먼저 설치 (소스 변경 시 캐시 재사용)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 복사
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
