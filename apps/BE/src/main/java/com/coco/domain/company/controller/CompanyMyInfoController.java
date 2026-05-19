package com.coco.domain.company.controller;

import com.coco.domain.company.dto.CompanyMyInfoResponse;
import com.coco.domain.company.dto.PasswordChangeRequest;
import com.coco.domain.company.service.CompanyMyInfoService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class CompanyMyInfoController {

    private final CompanyMyInfoService myInfoService;

    @GetMapping("/company/myinfo")
    public ApiResponse<CompanyMyInfoResponse> getMyInfo() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, myInfoService.getMyInfo());
    }

    /** 개인/기업 공통 비밀번호 변경 엔드포인트 */
    @PutMapping("/mypage/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody PasswordChangeRequest request) {
        myInfoService.changePassword(request);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.OK);
    }
}
