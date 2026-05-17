import axiosInstance from "../axiosInstance";

// 기업 홈 관련 API (추후 구현)
export const companyHomeService = {
  getSummary: () => axiosInstance.get("/company/dashboard/summary"),
};
