package com.running.controller;

import com.running.dto.ApiResponse;
import com.running.dto.RunningRecordResponse;
import com.running.service.RunningRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/running-records")
@RequiredArgsConstructor
public class RunningRecordController {

    private final RunningRecordService runningRecordService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<RunningRecordResponse>> upload(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.ok(runningRecordService.upload(file)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RunningRecordResponse>>> getRecords(
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(ApiResponse.ok(runningRecordService.getRecords(period)));
    }
}
