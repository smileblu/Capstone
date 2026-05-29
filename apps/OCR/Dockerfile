FROM node:20-alpine

WORKDIR /app

# 패키지 먼저 설치 (소스 변경 시 캐시 재사용)
COPY package*.json ./
RUN npm ci --omit=dev

# 소스 복사
COPY src/ src/

EXPOSE 3001

CMD ["node", "src/index.js"]
