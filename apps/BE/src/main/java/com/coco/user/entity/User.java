package com.coco.user.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor

public class User {
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

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User(String email, String passwordHash, String name, UserType userType) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.userType = userType;
        this.emailVerified = false;
        this.createdAt = LocalDateTime.now();
    }
    
}

