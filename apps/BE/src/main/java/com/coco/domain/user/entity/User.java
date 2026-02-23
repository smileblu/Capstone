package com.coco.domain.user.entity;

import com.coco.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users")
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(unique = true, nullable = false)
    private String email;

    private String passwordHash;

    private String name;

    @Enumerated(EnumType.STRING)
    private UserType userType;

    private Boolean emailVerified = false;

    @Builder
    public User(String email, String passwordHash, String name, UserType userType) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.userType = userType;
        this.emailVerified = false;
    }
}