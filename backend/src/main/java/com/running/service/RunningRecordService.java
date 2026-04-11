package com.running.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.running.dto.RunningRecordResponse;
import com.running.entity.RunningRecord;
import com.running.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RunningRecordService {

    private final RunningRecordRepository runningRecordRepository;
    private final GpxParserService gpxParserService;
    private final ObjectMapper objectMapper;

    public RunningRecordResponse upload(MultipartFile file) {
        String filename = file.getOriginalFilename();
        int dotIndex = filename.lastIndexOf(".");
        String title = (dotIndex != -1) ? filename.substring(0, dotIndex) : filename;

        if (runningRecordRepository.existsByTitle(title)) {
            throw new IllegalArgumentException("이미 존재하는 기록입니다: " + title);
        }

        GpxParserService.ParsedGpxData parsed = gpxParserService.parse(file);

        String coordinatesJson;
        try {
            coordinatesJson = objectMapper.writeValueAsString(parsed.coordinates());
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("좌표 데이터 직렬화 실패");
        }

        RunningRecord record = RunningRecord.builder()
                .title(title)
                .date(parsed.date())
                .distanceKm(parsed.distanceKm())
                .durationSeconds(parsed.durationSeconds())
                .coordinates(coordinatesJson)
                .build();

        return RunningRecordResponse.from(runningRecordRepository.save(record));
    }

    @Transactional(readOnly = true)
    public List<RunningRecordResponse> getRecords(String period) {
        List<RunningRecord> records;

        if (period == null) {
            records = runningRecordRepository.findAllByOrderByDateDesc();
        } else if ("today".equals(period)) {
            records = runningRecordRepository.findByDateOrderByCreatedAtDesc(LocalDate.now());
        } else if ("week".equals(period)) {
            records = runningRecordRepository.findByDateBetweenOrderByDateDesc(
                    LocalDate.now().minusDays(6), LocalDate.now()
            );
        } else {
            throw new IllegalArgumentException("유효하지 않은 period 값입니다. (today, week)");
        }

        return records.stream().map(RunningRecordResponse::from).toList();
    }
}
