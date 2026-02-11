package com.coco.global.auth;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;


import com.coco.global.auth.dto.SignupRequest;
import com.coco.user.entity.User;
import com.coco.user.entity.UserType;
import com.coco.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void signup(SignupRequest request) {

        if(userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("이미 존재하는 이메일");
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getName(),
                UserType.valueOf(request.getUserType())
        );

        userRepository.save(user);
    }
}
