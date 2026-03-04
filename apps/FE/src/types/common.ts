/**
 * 백엔드 공통 에러 응답 형식
 * @example { "code": "ACTIVITY_NOT_FOUND", "message": "해당 활동을 찾을 수 없습니다." }
 */
export interface ErrorResponse {
  code: string;    // 에러 식별 코드
  message: string; // 사용자에게 보여줄 에러 메시지
}

/**
 * 백엔드 공통 API 응답 규격 (Generic)
 * 백엔드의 ApiResponse.java 구조와 일치합니다.
 * @template T - 실제 데이터(data)의 타입
 */
export interface ApiResponse<T> {
  success: boolean;        // 요청 성공 여부
  data: T;                // 실제 응답 데이터
  error: ErrorResponse | null; // 실패 시 에러 정보, 성공 시 null
}