package com.running.controller;

import com.running.dto.ApiResponse;
import com.running.dto.CctvItem;
import com.running.service.CctvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
}
