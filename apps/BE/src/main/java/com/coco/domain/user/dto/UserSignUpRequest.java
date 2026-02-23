package com.coco.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserSignUpRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 30) String password,
        @NotBlank @Size(max = 30) String name
) {}