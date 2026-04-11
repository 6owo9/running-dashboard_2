package com.running.service;

import com.running.dto.RunningRecordResponse;
import com.running.entity.RunningRecord;
import com.running.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RunningRecordService {

    private final RunningRecordRepository runningRecordRepository;
    private final GpxParserService gpxParserService;

    public RunningRecordResponse upload(MultipartFile file, String title, LocalDate runDate,
                                        double distanceKm, Integer durationSeconds) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".gpx")) {
            throw new IllegalArgumentException("GPX 파일만 업로드할 수 있습니다.");
        }

        // 파일 바이트를 한 번만 읽어 좌표·날짜 모두 파싱
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new IllegalArgumentException("파일을 읽는 데 실패했습니다.");
        }
        String coordinatesJson = gpxParserService.parseCoordinates(new ByteArrayInputStream(fileBytes));

        // runDate 미입력 시 GPX time 태그에서 추출, 없으면 오늘
        LocalDate resolvedDate = runDate;
        if (resolvedDate == null) {
            LocalDate gpxDate = gpxParserService.parseRunDate(new ByteArrayInputStream(fileBytes));
            resolvedDate = (gpxDate != null) ? gpxDate : LocalDate.now();
        }

        // distanceKm 미입력(0) 시 좌표에서 자동 계산
        double resolvedDistance = distanceKm;
        if (resolvedDistance == 0) {
            var coords = gpxParserService.parseCoordinateJson(coordinatesJson);
            resolvedDistance = gpxParserService.calculateDistanceKm(coords);
        }

        RunningRecord record = new RunningRecord();
        record.setTitle(title);
        record.setRunDate(resolvedDate);
        record.setDistanceKm(resolvedDistance);
        record.setDurationSeconds(durationSeconds);
        record.setCoordinates(coordinatesJson);

        RunningRecord saved = runningRecordRepository.save(record);
        return toResponse(saved);
    }

    public List<RunningRecordResponse> getAll() {
        return runningRecordRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RunningRecordResponse> getByPeriod(String period) {
        LocalDate today = LocalDate.now();
        List<RunningRecord> records = switch (period) {
            case "today" -> runningRecordRepository.findByRunDate(today);
            case "week" -> runningRecordRepository.findByRunDateBetween(today.minusDays(6), today);
            default -> throw new IllegalArgumentException("지원하지 않는 period 값입니다: " + period);
        };
        return records.stream().map(this::toResponse).toList();
    }

    private RunningRecordResponse toResponse(RunningRecord record) {
        try {
            return RunningRecordResponse.builder()
                    .id(record.getId())
                    .title(record.getTitle())
                    .runDate(record.getRunDate())
                    .distanceKm(record.getDistanceKm())
                    .durationSeconds(record.getDurationSeconds())
                    .coordinates(gpxParserService.parseCoordinateJson(record.getCoordinates()))
                    .createdAt(record.getCreatedAt())
                    .build();
        } catch (Exception e) {
            log.error("좌표 파싱 실패 - recordId: {}", record.getId(), e);
            return RunningRecordResponse.builder()
                    .id(record.getId())
                    .title(record.getTitle())
                    .runDate(record.getRunDate())
                    .distanceKm(record.getDistanceKm())
                    .durationSeconds(record.getDurationSeconds())
                    .coordinates(List.of())
                    .createdAt(record.getCreatedAt())
                    .build();
        }
    }
}
