// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; 

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ''),
      },
      '/api/ocr': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      /** 카카오모빌리티 길찾기 — 브라우저 CORS 회피 (REST 키는 FE .env) */
      '/api/kakao-navi': {
        target: 'https://apis-navi.kakaomobility.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kakao-navi/, ''),
      },
      /** 카카오 로컬(키워드 검색) */
      '/api/kakao-local': {
        target: 'https://dapi.kakao.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kakao-local/, ''),
      },
    },
  },
});