/**
 * 백엔드 ApiResponse.java 구조와 일치
 * { isSuccess, code, message, result, errors }
 */
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
  errors: any;
}
