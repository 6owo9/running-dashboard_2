package com.running.controller;

import com.running.dto.ApiResponse;
import com.running.dto.RunningRecordResponse;
import com.running.service.RunningRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/running-records")
@RequiredArgsConstructor
public class RunningRecordController {

    private final RunningRecordService runningRecordService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<RunningRecordResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "runDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate runDate,
            @RequestParam(value = "distanceKm", required = false, defaultValue = "0") double distanceKm,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds
    ) {
        // title 미입력 시 파일명(확장자 제거) 사용
        String resolvedTitle = (title != null && !title.isBlank())
                ? title
                : stripExtension(file.getOriginalFilename());

        RunningRecordResponse response = runningRecordService.upload(file, resolvedTitle, runDate, distanceKm, durationSeconds);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private String stripExtension(String filename) {
        if (filename == null) return "untitled";
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RunningRecordResponse>>> getRecords(
            @RequestParam(required = false) String period
    ) {
        List<RunningRecordResponse> records = period != null
                ? runningRecordService.getByPeriod(period)
                : runningRecordService.getAll();
        return ResponseEntity.ok(ApiResponse.ok(records));
    }
}
