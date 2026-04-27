package com.running.service;

import com.running.config.FieldEncryptor;
import com.running.config.JwtUtil;
import com.running.dto.LoginRequest;
import com.running.dto.LoginResponse;
import com.running.dto.SignupRequest;
import com.running.dto.UserResponse;
import com.running.entity.User;
import com.running.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final FieldEncryptor fieldEncryptor;

    public LoginResponse signup(SignupRequest request) {
        validate(request);

        String usernameHash = fieldEncryptor.hash(request.getUsername());
        String emailHash = fieldEncryptor.hash(request.getEmail());

        if (userRepository.existsByUsernameHash(usernameHash)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmailHash(emailHash)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = User.builder()
                .usernameHash(usernameHash)
                .usernameEncrypted(fieldEncryptor.encrypt(request.getUsername()))
                .emailHash(emailHash)
                .emailEncrypted(fieldEncryptor.encrypt(request.getEmail()))
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .profileImageId(1)
                .build();

        User saved = userRepository.save(user);
        return LoginResponse.builder()
                .token(jwtUtil.generate(saved.getId(), request.getUsername()))
                .user(UserResponse.from(saved, request.getUsername()))
                .build();
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String usernameHash = fieldEncryptor.hash(request.getUsername());

        User user = userRepository.findByUsernameHash(usernameHash)
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String decryptedUsername = fieldEncryptor.decrypt(user.getUsernameEncrypted());
        return LoginResponse.builder()
                .token(jwtUtil.generate(user.getId(), decryptedUsername))
                .user(UserResponse.from(user, decryptedUsername))
                .build();
    }

    private void validate(SignupRequest req) {
        if (req.getUsername() == null || !req.getUsername().matches("[a-zA-Z0-9_]{3,20}")) {
            throw new IllegalArgumentException("아이디는 3~20자의 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.");
        }
        if (req.getEmail() == null || !req.getEmail().contains("@")) {
            throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
        }
        if (req.getPassword() == null || req.getPassword().length() < 8
                || !req.getPassword().matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            throw new IllegalArgumentException("비밀번호는 8자 이상, 특수문자를 포함해야 합니다.");
        }
        if (req.getNickname() == null || req.getNickname().isBlank() || req.getNickname().length() > 20) {
            throw new IllegalArgumentException("닉네임은 1~20자여야 합니다.");
        }
    }
}
