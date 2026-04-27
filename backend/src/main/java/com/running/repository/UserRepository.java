package com.running.repository;

import com.running.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsernameHash(String usernameHash);
    Optional<User> findByKakaoId(Long kakaoId);
    boolean existsByUsernameHash(String usernameHash);
    boolean existsByEmailHash(String emailHash);
}
