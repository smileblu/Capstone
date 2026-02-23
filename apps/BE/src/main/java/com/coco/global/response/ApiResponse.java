package com.coco.global.response;

import com.coco.global.error.code.BaseErrorCode;
import com.coco.global.error.code.BaseSuccessCode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.ResponseEntity;

@Getter
@AllArgsConstructor
@JsonPropertyOrder({"isSuccess", "code", "message", "result", "errors"})
public class ApiResponse<T> {

    @JsonProperty("isSuccess")
    private final Boolean isSuccess;

    private final String code;
    private final String message;
    private final T result;
    private final Object errors;

    // ====== Body 생성 (ApiResponse만) ======
    public static <T> ApiResponse<T> onSuccess(BaseSuccessCode code, T result) {
        return new ApiResponse<>(true, code.getCode(), code.getMessage(), result, null);
    }

    public static ApiResponse<Void> onSuccess(BaseSuccessCode code) {
        return new ApiResponse<>(true, code.getCode(), code.getMessage(), null, null);
    }

    public static ApiResponse<Void> onFailure(BaseErrorCode code) {
        return new ApiResponse<>(false, code.getCode(), code.getMessage(), null, null);
    }

    public static ApiResponse<Void> onFailure(BaseErrorCode code, Object errors) {
        return new ApiResponse<>(false, code.getCode(), code.getMessage(), null, errors);
    }

    // ====== ResponseEntity까지 생성 (상태코드 자동) ======
    public static <T> ResponseEntity<ApiResponse<T>> toResponseEntity(BaseSuccessCode code, T result) {
        return ResponseEntity.status(code.getStatus()).body(onSuccess(code, result));
    }

    public static ResponseEntity<ApiResponse<Void>> toResponseEntity(BaseSuccessCode code) {
        return ResponseEntity.status(code.getStatus()).body(onSuccess(code));
    }

    public static ResponseEntity<ApiResponse<Void>> toResponseEntity(BaseErrorCode code) {
        return ResponseEntity.status(code.getStatus()).body(onFailure(code));
    }

    public static ResponseEntity<ApiResponse<Void>> toResponseEntity(BaseErrorCode code, Object errors) {
        return ResponseEntity.status(code.getStatus()).body(onFailure(code, errors));
    }
}