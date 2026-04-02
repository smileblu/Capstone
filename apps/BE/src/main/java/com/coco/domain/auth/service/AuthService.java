package com.coco.domain.auth.service;

import com.coco.domain.auth.dto.LoginRequest;
import com.coco.domain.auth.dto.LoginResponse;
import com.coco.domain.auth.dto.SignupRequest;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.entity.UserType;
import com.coco.domain.user.repository.UserRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public void signup(SignupRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new GeneralException(GeneralErrorCode.DUPLICATE_EMAIL);
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .userType(UserType.valueOf(request.getUserType()))
                .build();

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        String token = jwtTokenProvider.generateToken(user.getUserId(), user.getEmail());
        return new LoginResponse(token, user.getUserId(), user.getEmail());
    }
}
