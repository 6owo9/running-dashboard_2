package com.running.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String usernameHash;

    @Column(nullable = false)
    private String usernameEncrypted;

    @Column(nullable = false, unique = true)
    private String emailHash;

    @Column(nullable = false)
    private String emailEncrypted;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String nickname;

    @Column(nullable = false)
    private Integer profileImageId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public User(String usernameHash, String usernameEncrypted,
                String emailHash, String emailEncrypted,
                String passwordHash, String nickname, int profileImageId) {
        this.usernameHash = usernameHash;
        this.usernameEncrypted = usernameEncrypted;
        this.emailHash = emailHash;
        this.emailEncrypted = emailEncrypted;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.profileImageId = profileImageId;
        this.createdAt = LocalDateTime.now();
    }

    public void updateProfile(String nickname, int profileImageId) {
        this.nickname = nickname;
        this.profileImageId = profileImageId;
    }

    public void updatePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
    }
}
