package com.running.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.running.config.FieldEncryptor;
import com.running.config.JwtUtil;
import com.running.dto.LoginResponse;
import com.running.dto.UserResponse;
import com.running.entity.User;
import com.running.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoAuthService {

    private final UserRepository userRepository;
    private final FieldEncryptor fieldEncryptor;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Value("${kakao.client-id}")
    private String clientId;

    @Value("${kakao.client-secret}")
    private String clientSecret;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public LoginResponse kakaoLogin(String code) {
        try {
            String accessToken = fetchAccessToken(code);
            JsonNode userInfo = fetchUserInfo(accessToken);

            Long kakaoId = userInfo.get("id").asLong();
            String nickname = userInfo.path("kakao_account").path("profile").path("nickname").asText("카카오유저");
            String email = userInfo.path("kakao_account").path("email").asText(null);

            User user = userRepository.findByKakaoId(kakaoId)
                    .orElseGet(() -> createUser(kakaoId, nickname, email));

            String token = jwtUtil.generate(user.getId(), user.getNickname());
            return LoginResponse.builder()
                    .token(token)
                    .user(UserResponse.from(user, "kakao_" + kakaoId))
                    .build();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("카카오 로그인 처리 중 오류가 발생했습니다.", e);
        }
    }

    private String fetchAccessToken(String code) throws Exception {
        String body = "grant_type=authorization_code"
                + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://kauth.kakao.com/oauth/token"))
                .header("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        log.debug("카카오 토큰 응답: {}", response.body());
        JsonNode json = objectMapper.readTree(response.body());

        if (json.has("error")) {
            log.error("카카오 토큰 오류: {} / {}", json.get("error").asText(), json.path("error_description").asText(""));
            throw new IllegalArgumentException("유효하지 않은 카카오 인증 코드입니다.");
        }
        return json.get("access_token").asText();
    }

    private JsonNode fetchUserInfo(String accessToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://kapi.kakao.com/v2/user/me"))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return objectMapper.readTree(response.body());
    }

    private User createUser(Long kakaoId, String nickname, String email) {
        String pseudoUsername = "kakao_" + kakaoId;
        String resolvedEmail = (email != null && !email.isBlank()) ? email : pseudoUsername + "@kakao.local";

        User user = User.kakaoBuilder()
                .kakaoId(kakaoId)
                .usernameHash(fieldEncryptor.hash(pseudoUsername))
                .usernameEncrypted(fieldEncryptor.encrypt(pseudoUsername))
                .emailHash(fieldEncryptor.hash(resolvedEmail))
                .emailEncrypted(fieldEncryptor.encrypt(resolvedEmail))
                .nickname(nickname)
                .profileImageId(1)
                .build();

        return userRepository.save(user);
    }
}
