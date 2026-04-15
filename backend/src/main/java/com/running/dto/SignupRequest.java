package com.running.dto;

import lombok.Getter;

@Getter
public class SignupRequest {
    private String username;
    private String email;
    private String password;
    private String nickname;
}
