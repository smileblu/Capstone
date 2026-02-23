package com.coco.domain.user.controller;

import com.coco.domain.user.dto.UserResponse;
import com.coco.domain.user.dto.UserSignUpRequest;
import com.coco.domain.user.service.UserService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signUp(@Valid @RequestBody UserSignUpRequest req) {
        UserResponse result = userService.signUp(req);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.CREATED, result);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long userId) {
        UserResponse result = userService.getUser(userId);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.OK, result);
    }
}