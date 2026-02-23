package com.coco.domain.user.service;

import com.coco.domain.user.dto.UserResponse;
import com.coco.domain.user.dto.UserSignUpRequest;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.error.code.GeneralErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public UserResponse signUp(UserSignUpRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new GeneralException(GeneralErrorCode.DUPLICATE_EMAIL);
        }

        // TODO: 나중에 PasswordEncoder로 암호화
        User user = User.builder()
                .email(req.email())
                .passwordHash(req.password())
                .name(req.name())
                .build();

        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        return UserResponse.from(user);
    }
}