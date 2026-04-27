package com.running.controller;

import com.running.dto.ApiResponse;
import com.running.dto.LoginResponse;
import com.running.service.KakaoAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/kakao")
@RequiredArgsConstructor
public class KakaoAuthController {

    private final KakaoAuthService kakaoAuthService;

    @GetMapping("/callback")
    public ResponseEntity<ApiResponse<LoginResponse>> callback(@RequestParam String code) {
        LoginResponse result = kakaoAuthService.kakaoLogin(code);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
