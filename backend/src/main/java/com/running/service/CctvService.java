package com.running.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.running.dto.CctvItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CctvService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${its.api-key:}")
    private String apiKey;

    public List<CctvItem> getCctvList(double minX, double maxX, double minY, double maxY) {
        if (apiKey.isBlank()) {
            log.warn("ITS API 키가 설정되지 않았습니다. ITS_API_KEY 환경변수를 설정하세요.");
            return List.of();
        }
        try {
            String url = String.format(
                    "https://openapi.its.go.kr:9443/cctvInfo?apiKey=%s&type=its&cctvType=2&minX=%s&maxX=%s&minY=%s&maxY=%s&getType=json",
                    apiKey, minX, maxX, minY, maxY
            );
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode data = objectMapper.readTree(response.body()).path("response").path("data");
            List<CctvItem> result = new ArrayList<>();
            if (data.isArray()) {
                for (JsonNode node : data) {
                    result.add(new CctvItem(
                            node.path("cctvname").asText(),
                            node.path("cctvurl").asText(),
                            node.path("coordx").asDouble(),
                            node.path("coordy").asDouble()
                    ));
                }
            }
            return result;
        } catch (Exception e) {
            log.error("ITS CCTV API 호출 실패", e);
            return List.of();
        }
    }
}
