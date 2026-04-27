package com.running.service;

import com.running.config.FieldEncryptor;
import com.running.dto.PasswordChangeRequest;
import com.running.dto.ProfileUpdateRequest;
import com.running.dto.UserResponse;
import com.running.entity.User;
import com.running.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final FieldEncryptor fieldEncryptor;

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = findUser(userId);
        return UserResponse.from(user, fieldEncryptor.decrypt(user.getUsernameEncrypted()));
    }

    public UserResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        if (request.getNickname() == null || request.getNickname().isBlank() || request.getNickname().length() > 20) {
            throw new IllegalArgumentException("닉네임은 1~20자여야 합니다.");
        }
        if (request.getProfileImageId() == null || request.getProfileImageId() < 1 || request.getProfileImageId() > 5) {
            throw new IllegalArgumentException("올바른 프로필 이미지를 선택해주세요.");
        }

        User user = findUser(userId);
        user.updateProfile(request.getNickname(), request.getProfileImageId());
        return UserResponse.from(user, fieldEncryptor.decrypt(user.getUsernameEncrypted()));
    }

    public void changePassword(Long userId, PasswordChangeRequest request) {
        User user = findUser(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8
                || !request.getNewPassword().matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            throw new IllegalArgumentException("비밀번호는 8자 이상, 특수문자를 포함해야 합니다.");
        }

        user.updatePassword(passwordEncoder.encode(request.getNewPassword()));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다."));
    }
}
