package com.coco.domain.auth.controller;

import com.coco.domain.auth.dto.LoginRequest;
import com.coco.domain.auth.dto.LoginResponse;
import com.coco.domain.auth.dto.SignupRequest;
import com.coco.domain.auth.service.AuthService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.OK, response);
    }
}
