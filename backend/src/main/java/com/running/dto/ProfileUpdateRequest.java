package com.running.dto;

import lombok.Getter;

@Getter
public class ProfileUpdateRequest {
    private String nickname;
    private Integer profileImageId;
}
