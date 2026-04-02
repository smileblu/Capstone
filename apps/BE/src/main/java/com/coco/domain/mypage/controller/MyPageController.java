package com.coco.domain.mypage.controller;

import com.coco.domain.mypage.dto.AddRouteRequest;
import com.coco.domain.mypage.dto.MyPageResponse;
import com.coco.domain.mypage.service.MyPageService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/mypage")
public class MyPageController {

    private final MyPageService myPageService;

    @GetMapping
    public ApiResponse<MyPageResponse> getMyPage() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, myPageService.getMyPage());
    }

    @PostMapping("/routes")
    public ResponseEntity<ApiResponse<Void>> addRoute(@RequestBody AddRouteRequest request) {
        myPageService.addRoute(request);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.CREATED);
    }

    @DeleteMapping("/routes/{routeId}")
    public ResponseEntity<ApiResponse<Void>> deleteRoute(@PathVariable Long routeId) {
        myPageService.deleteRoute(routeId);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.OK);
    }
}
