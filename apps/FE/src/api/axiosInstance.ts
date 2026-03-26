import axios, { type AxiosResponse } from "axios"; // type 키워드 추가
import type { ApiResponse } from "../types/common"; // 전체를 타입으로 가져올 때

const axiosInstance = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" }
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    if (response.data.success) {
      return response.data.data;
    }
    return Promise.reject(response.data.error);
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;