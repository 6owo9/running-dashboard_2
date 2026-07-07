package com.running.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.running.dto.CctvItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class CctvService {

    private static final String CCTV_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = buildHttpClient();

    private static HttpClient buildHttpClient() {
        try {
            // 한국 정부 사이트(UTIC 등)는 KISA 인증서를 사용하며 Java 기본 truststore에 없음
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                public void checkClientTrusted(X509Certificate[] c, String a) {}
                public void checkServerTrusted(X509Certificate[] c, String a) {}
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            }}, new java.security.SecureRandom());
            return HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .connectTimeout(Duration.ofSeconds(5))
                    .sslContext(sslContext)
                    .build();
        } catch (Exception e) {
            return HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();
        }
    }

    @Value("${its.api-key:}")
    private String itsApiKey;

    @Value("${cctv.provider:both}")
    private String cctvProvider;

    public List<CctvItem> getCctvList(double minX, double maxX, double minY, double maxY) {
        String provider = cctvProvider.trim().toLowerCase(Locale.ROOT);
        return switch (provider) {
            case "utic" -> getUticCctvList(minX, maxX, minY, maxY);
            case "both" -> {
                var itsFuture  = CompletableFuture.supplyAsync(() -> getItsCctvList(minX, maxX, minY, maxY));
                var uticFuture = CompletableFuture.supplyAsync(() -> getUticCctvList(minX, maxX, minY, maxY));
                List<CctvItem> merged = new ArrayList<>(itsFuture.join());
                merged.addAll(uticFuture.join());
                yield merged;
            }
            default -> getItsCctvList(minX, maxX, minY, maxY);
        };
    }

    private List<CctvItem> getItsCctvList(double minX, double maxX, double minY, double maxY) {
        String normalizedApiKey = itsApiKey.trim();
        if (normalizedApiKey.isBlank()) {
            log.warn("ITS API key is not configured. Set ITS_API_KEY.");
            return List.of();
        }

        // type=its(국도)와 type=ex(고속도로)를 4개 병렬 조회
        var itsHlsFuture  = CompletableFuture.supplyAsync(() -> fetchCctvList(normalizedApiKey, "its", 1, minX, maxX, minY, maxY));
        var exHlsFuture   = CompletableFuture.supplyAsync(() -> fetchCctvList(normalizedApiKey, "ex",  1, minX, maxX, minY, maxY));
        var itsImgFuture  = CompletableFuture.supplyAsync(() -> fetchCctvList(normalizedApiKey, "its", 3, minX, maxX, minY, maxY));
        var exImgFuture   = CompletableFuture.supplyAsync(() -> fetchCctvList(normalizedApiKey, "ex",  3, minX, maxX, minY, maxY));

        List<CctvItem> hlsItems   = Stream.concat(itsHlsFuture.join().stream(), exHlsFuture.join().stream()).toList();
        List<CctvItem> imageItems = Stream.concat(itsImgFuture.join().stream(), exImgFuture.join().stream()).toList();

        List<CctvItem> result = new ArrayList<>(hlsItems.stream()
                .map(item -> new CctvItem(
                        item.cctvname(),
                        item.cctvurl(),
                        findImageUrl(item, imageItems),
                        item.coordx(),
                        item.coordy()
                ))
                .toList());

        // HLS 스트림이 없는 정지영상 CCTV도 포함
        Set<String> hlsNames = hlsItems.stream()
                .map(CctvItem::cctvname)
                .collect(Collectors.toSet());
        imageItems.stream()
                .filter(img -> !hlsNames.contains(img.cctvname()))
                .map(img -> new CctvItem(img.cctvname(), img.cctvurl(), img.cctvurl(), img.coordx(), img.coordy()))
                .forEach(result::add);

        return result;
    }

    private List<CctvItem> getUticCctvList(double minX, double maxX, double minY, double maxY) {
        try {
            String body = String.format("MIN_X=%s&MIN_Y=%s&MAX_X=%s&MAX_Y=%s", minX, minY, maxX, maxY);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.utic.go.kr/map/mapcctv.do"))
                    .timeout(Duration.ofSeconds(10))
                    .header(HttpHeaders.USER_AGENT, CCTV_USER_AGENT)
                    .header(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded")
                    .header("Referer", "https://www.utic.go.kr/map/map.do?menu=cctv")
                    .header("Origin", "https://www.utic.go.kr")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("UTIC CCTV API returned status {}", response.statusCode());
                return List.of();
            }
            JsonNode root = objectMapper.readTree(response.body());
            if (root.isObject() && root.has("code")) {
                log.warn("UTIC CCTV API error: {}", root.path("msg").asText());
                return List.of();
            }
            if (!root.isArray()) {
                log.warn("Unexpected UTIC CCTV response: {}", response.body().substring(0, Math.min(200, response.body().length())));
                return List.of();
            }

            List<CctvItem> result = new ArrayList<>();
            for (JsonNode node : root) {
                double coordX = node.path("XCOORD").asDouble(Double.NaN);
                double coordY = node.path("YCOORD").asDouble(Double.NaN);
                if (!isInside(coordX, coordY, minX, maxX, minY, maxY)) {
                    continue;
                }
                String name = node.path("CCTVNAME").asText("");
                if (name.isBlank()) name = "UTIC CCTV";

                String kind = node.path("KIND").asText("");
                String cctvUrl = "";
                String cctvImageUrl = "";

                if ("MODE".equals(kind)) {
                    // 서울: strm{CH-50}.spatic.go.kr/live/{ID}.stream/playlist.m3u8
                    String id = node.path("ID").asText("");
                    int ch = node.path("CH").asInt(0);
                    if (!id.isBlank() && ch > 50) {
                        int srvNum = ch - 50;
                        cctvUrl = "https://strm" + srvNum + ".spatic.go.kr/live/" + id + ".stream/playlist.m3u8";
                    }
                } else if ("EE".equals(kind)) {
                    // 경기도: cctvimageurl에 cctvIp 마커를 넣어 프론트에서 on-demand 조회
                    String cctvIp = node.path("CCTVIP").asText("");
                    if (!cctvIp.isBlank()) {
                        cctvImageUrl = "utic-ee://" + cctvIp;
                    }
                }

                result.add(new CctvItem(name, cctvUrl, cctvImageUrl, coordX, coordY));
            }
            log.debug("UTIC CCTV returned {} items", result.size());
            return result;
        } catch (Exception e) {
            log.error("Failed to call UTIC CCTV API", e);
            return List.of();
        }
    }

    private List<CctvItem> fetchCctvList(
            String normalizedApiKey,
            String type,
            int cctvType,
            double minX,
            double maxX,
            double minY,
            double maxY
    ) {
        try {
            String url = String.format(
                    "https://openapi.its.go.kr:9443/cctvInfo?apiKey=%s&type=%s&cctvType=%s&minX=%s&maxX=%s&minY=%s&maxY=%s&getType=json",
                    normalizedApiKey, type, cctvType, minX, maxX, minY, maxY
            );
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode data = objectMapper.readTree(response.body()).path("response").path("data");
            List<CctvItem> result = new ArrayList<>();
            if (data.isArray()) {
                for (JsonNode node : data) {
                    String cctvUrl = node.path("cctvurl").asText();
                    result.add(new CctvItem(
                            node.path("cctvname").asText(),
                            cctvUrl,
                            cctvUrl,
                            node.path("coordx").asDouble(),
                            node.path("coordy").asDouble()
                    ));
                }
            }
            return result;
        } catch (Exception e) {
            log.error("Failed to call ITS CCTV API", e);
            return List.of();
        }
    }

    private String findImageUrl(CctvItem hlsItem, List<CctvItem> imageItems) {
        return imageItems.stream()
                .filter(imageItem -> imageItem.cctvname().equals(hlsItem.cctvname()))
                .findFirst()
                .or(() -> imageItems.stream()
                        .filter(imageItem ->
                                Math.abs(imageItem.coordx() - hlsItem.coordx()) < 0.00001 &&
                                        Math.abs(imageItem.coordy() - hlsItem.coordy()) < 0.00001
                        )
                        .findFirst())
                .map(CctvItem::cctvurl)
                .orElse("");
    }

    private double number(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (value.isNumber()) {
                return value.asDouble();
            }
            if (value.isTextual() && !value.asText().isBlank()) {
                try {
                    return Double.parseDouble(value.asText());
                } catch (NumberFormatException ignored) {
                    // Try the next candidate field.
                }
            }
        }
        return Double.NaN;
    }

    private boolean isInside(double coordX, double coordY, double minX, double maxX, double minY, double maxY) {
        return Double.isFinite(coordX)
                && Double.isFinite(coordY)
                && coordX >= minX
                && coordX <= maxX
                && coordY >= minY
                && coordY <= maxY;
    }

    public CctvImage getCctvImage(String url) {
        try {
            URI uri = validateCctvUri(url);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(Duration.ofSeconds(15))
                    .header(HttpHeaders.USER_AGENT, CCTV_USER_AGENT)
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            String contentType = response.headers()
                    .firstValue(HttpHeaders.CONTENT_TYPE)
                    .orElse(MediaType.IMAGE_JPEG_VALUE);

            return new CctvImage(response.body(), contentType, response.uri().toString());
        } catch (Exception e) {
            log.error("Failed to proxy ITS CCTV media", e);
            return new CctvImage(new byte[0], MediaType.APPLICATION_OCTET_STREAM_VALUE, url);
        }
    }

    public CctvStream getCctvStream(String url, String range) {
        try {
            URI uri = validateCctvUri(url);
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(uri)
                    .header(HttpHeaders.USER_AGENT, CCTV_USER_AGENT)
                    .GET();
            if (range != null && !range.isBlank()) {
                requestBuilder.header(HttpHeaders.RANGE, range);
            }
            HttpResponse<InputStream> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() >= 400) {
                response.body().close();
                return null;
            }

            String contentType = response.headers()
                    .firstValue(HttpHeaders.CONTENT_TYPE)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE);
            Long contentLength = response.headers()
                    .firstValue(HttpHeaders.CONTENT_LENGTH)
                    .map(Long::parseLong)
                    .orElse(null);
            String contentRange = response.headers()
                    .firstValue(HttpHeaders.CONTENT_RANGE)
                    .orElse(null);
            String acceptRanges = response.headers()
                    .firstValue(HttpHeaders.ACCEPT_RANGES)
                    .orElse(null);

            return new CctvStream(
                    response.body(),
                    contentType,
                    response.statusCode(),
                    contentLength,
                    contentRange,
                    acceptRanges
            );
        } catch (Exception e) {
            log.error("Failed to proxy ITS CCTV stream", e);
            return null;
        }
    }

    public String fetchGyeonggiStreamUrl(String cctvIp) {
        if (cctvIp == null || cctvIp.isBlank()) return null;
        try {
            String url = "https://www.utic.go.kr/map/getGyeonggiCctvUrl.do?cctvIp="
                    + URLEncoder.encode(cctvIp.trim(), StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header(HttpHeaders.USER_AGENT, CCTV_USER_AGENT)
                    .header("Referer", "https://www.utic.go.kr/map/map.do?menu=cctv")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String body = response.body() == null ? "" : response.body().trim();
            if (body.isEmpty()) return null;
            if (body.startsWith("//")) body = "https:" + body;
            return body;
        } catch (Exception e) {
            log.error("Failed to fetch Gyeonggi CCTV stream URL for cctvIp={}", cctvIp, e);
            return null;
        }
    }

    private URI validateCctvUri(String url) {
        URI uri = URI.create(url);
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        if (!host.endsWith(".ktict.co.kr")
                && !host.endsWith(".its.go.kr")
                && !host.endsWith(".spatic.go.kr")
                && !host.equals("utic.go.kr")
                && !host.endsWith(".utic.go.kr")) {
            throw new IllegalArgumentException("Unsupported CCTV media host: " + host);
        }
        return uri;
    }

    public record CctvImage(byte[] body, String contentType, String finalUrl) {}

    public record CctvStream(
            InputStream body,
            String contentType,
            int statusCode,
            Long contentLength,
            String contentRange,
            String acceptRanges
    ) {}
}
