package com.running.dto;

import com.running.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String nickname;
    private Integer profileImageId;

    public static UserResponse from(User user, String decryptedUsername) {
        return UserResponse.builder()
                .id(user.getId())
                .username(decryptedUsername)
                .nickname(user.getNickname())
                .profileImageId(user.getProfileImageId())
                .build();
    }
}
