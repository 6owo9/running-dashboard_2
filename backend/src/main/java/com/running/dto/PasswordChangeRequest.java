package com.running.dto;

import lombok.Getter;

@Getter
public class PasswordChangeRequest {
    private String currentPassword;
    private String newPassword;
}
