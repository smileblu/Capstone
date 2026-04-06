package com.coco.global.security;

import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    private SecurityUtil() {}

    /** 현재 로그인된 사용자의 userId 반환. 인증 정보 없으면 예외. */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof Long)) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }
        return (Long) principal;
    }
}
