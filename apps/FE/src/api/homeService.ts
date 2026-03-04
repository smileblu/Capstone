import axiosInstance from "./axiosInstance";
import type { MonthlySummary, MonthlyTrend, CategoryRatio } from "../types/home";

// 명세서: GET /api/v1/dashboard/monthly-summary
export const getMonthlySummary = () => 
  axiosInstance.get<any, MonthlySummary>("/dashboard/monthly-summary");

// 명세서: GET /api/v1/dashboard/monthly-trend
export const getMonthlyTrend = () => 
  axiosInstance.get<any, MonthlyTrend[]>("/dashboard/monthly-trend");

// 명세서: GET /api/v1/dashboard/category-ratio
export const getCategoryRatio = () => 
  axiosInstance.get<any, CategoryRatio[]>("/dashboard/category-ratio");