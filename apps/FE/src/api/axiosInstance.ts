import axios, { type AxiosResponse } from "axios";
import type { ApiResponse } from "../types/common";

const axiosInstance = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// 요청 시 localStorage의 토큰을 Authorization 헤더에 자동 추가
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: ApiResponse.result 값만 추출해서 반환
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    // 빈 바디(204, Void 응답 등) 처리
    if (!response.data || typeof response.data !== "object") {
      return null;
    }
    if (response.data.isSuccess) {
      return response.data.result ?? null;
    }
    return Promise.reject(response.data);
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
