package com.coco.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())        // CSRF 비활성화
                .formLogin(form -> form.disable())  // ✅ 기본 로그인 페이지 끄기
                .httpBasic(basic -> basic.disable())// ✅ 기본 http basic 끄기
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()       // 일단 전부 허용 (테스트용)
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
