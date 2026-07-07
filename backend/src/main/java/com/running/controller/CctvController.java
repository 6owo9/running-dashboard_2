package com.running.controller;

import com.running.dto.ApiResponse;
import com.running.dto.CctvItem;
import com.running.service.CctvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cctv")
@RequiredArgsConstructor
public class CctvController {

    private final CctvService cctvService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CctvItem>>> getCctvList(
            @RequestParam double minX,
            @RequestParam double maxX,
            @RequestParam double minY,
            @RequestParam double maxY
    ) {
        return ResponseEntity.ok(ApiResponse.ok(cctvService.getCctvList(minX, maxX, minY, maxY)));
    }

    @GetMapping("/stream-url")
    public ResponseEntity<ApiResponse<String>> getGyeonggiStreamUrl(@RequestParam String cctvIp) {
        String url = cctvService.fetchGyeonggiStreamUrl(cctvIp);
        return ResponseEntity.ok(ApiResponse.ok(url));
    }

    @GetMapping("/image")
    public ResponseEntity<byte[]> getCctvImage(@RequestParam String url) {
        CctvService.CctvImage image = cctvService.getCctvImage(url);
        if (image.body().length == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(image.contentType()))
                .body(image.body());
    }

    @GetMapping("/hls")
    public ResponseEntity<byte[]> getCctvHls(@RequestParam String url) {
        CctvService.CctvImage media = cctvService.getCctvImage(url);
        if (media.body().length == 0) {
            return ResponseEntity.notFound().build();
        }

        String contentType = media.contentType();
        byte[] body = media.body();
        if (contentType.contains("mpegurl") || startsWithPlaylist(body)) {
            body = rewritePlaylist(media.finalUrl(), new String(body, StandardCharsets.UTF_8)).getBytes(StandardCharsets.UTF_8);
            contentType = "application/vnd.apple.mpegurl";
        } else if (media.finalUrl().contains(".ts")) {
            contentType = "video/mp2t";
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(contentType))
                .body(body);
    }

    @GetMapping("/stream")
    public ResponseEntity<StreamingResponseBody> getCctvStream(
            @RequestParam String url,
            @RequestHeader(value = "Range", required = false) String range
    ) {
        CctvService.CctvStream stream = cctvService.getCctvStream(url, range);
        if (stream == null) {
            return ResponseEntity.notFound().build();
        }

        StreamingResponseBody body = outputStream -> {
            try (var inputStream = stream.body()) {
                inputStream.transferTo(outputStream);
            }
        };

        ResponseEntity.BodyBuilder response = ResponseEntity.status(stream.statusCode())
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(stream.contentType()));
        if (stream.contentLength() != null) {
            response.contentLength(stream.contentLength());
        }
        if (stream.contentRange() != null) {
            response.header(HttpHeaders.CONTENT_RANGE, stream.contentRange());
        }
        if (stream.acceptRanges() != null) {
            response.header(HttpHeaders.ACCEPT_RANGES, stream.acceptRanges());
        }
        return response.body(body);
    }

    private boolean startsWithPlaylist(byte[] body) {
        if (body.length < 7) {
            return false;
        }
        return new String(body, 0, Math.min(body.length, 16), StandardCharsets.UTF_8).startsWith("#EXTM3U");
    }

    private String rewritePlaylist(String baseUrl, String playlist) {
        URI baseUri = URI.create(baseUrl);
        StringBuilder rewritten = new StringBuilder();
        for (String line : playlist.split("\\R", -1)) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                rewritten.append(line).append('\n');
                continue;
            }
            String resolvedUrl = baseUri.resolve(trimmed).toString();
            rewritten.append("/api/cctv/hls?url=")
                    .append(URLEncoder.encode(resolvedUrl, StandardCharsets.UTF_8))
                    .append('\n');
        }
        return rewritten.toString();
    }
}
