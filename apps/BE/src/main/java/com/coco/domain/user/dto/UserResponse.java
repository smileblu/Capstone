package com.coco.domain.user.dto;

import com.coco.domain.user.entity.User;

public record UserResponse(
        Long id,
        String email,
        String name
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getUserId(), user.getEmail(), user.getName());
    }
}