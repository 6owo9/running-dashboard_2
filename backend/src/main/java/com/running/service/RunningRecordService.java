package com.running.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.running.dto.RunningRecordResponse;
import com.running.entity.RunningRecord;
import com.running.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RunningRecordService {

    private final RunningRecordRepository runningRecordRepository;
    private final GpxParserService gpxParserService;
    private final ObjectMapper objectMapper;

    public RunningRecordResponse upload(MultipartFile file, Long userId) {
        String filename = file.getOriginalFilename();
        String title;
        if (filename == null || filename.isBlank()) {
            title = "run_" + LocalDate.now();
        } else {
            int dotIndex = filename.lastIndexOf(".");
            title = (dotIndex != -1) ? filename.substring(0, dotIndex) : filename;
        }

        if (runningRecordRepository.existsByTitleAndUserId(title, userId)) {
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
                .userId(userId)
                .build();

        return RunningRecordResponse.from(runningRecordRepository.save(record));
    }

    public void delete(Long id, Long userId) {
        RunningRecord record = runningRecordRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("기록을 찾을 수 없습니다: " + id));
        if (!userId.equals(record.getUserId())) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }
        runningRecordRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<RunningRecordResponse> getRecords(String period, Long userId) {
        List<RunningRecord> records;
        LocalDate today = LocalDate.now();

        if (userId != null) {
            // 로그인: 내 기록만
            if (period == null) {
                records = runningRecordRepository.findByUserIdOrderByDateDesc(userId);
            } else if ("today".equals(period)) {
                records = runningRecordRepository.findByUserIdAndDateOrderByCreatedAtDesc(userId, today);
            } else if ("week".equals(period)) {
                records = runningRecordRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, today.minusDays(6), today);
            } else {
                throw new IllegalArgumentException("유효하지 않은 period 값입니다. (today, week)");
            }
        } else {
            // 게스트: 전체 기록
            if (period == null) {
                records = runningRecordRepository.findAllByOrderByDateDesc();
            } else if ("today".equals(period)) {
                records = runningRecordRepository.findByDateOrderByCreatedAtDesc(today);
            } else if ("week".equals(period)) {
                records = runningRecordRepository.findByDateBetweenOrderByDateDesc(today.minusDays(6), today);
            } else {
                throw new IllegalArgumentException("유효하지 않은 period 값입니다. (today, week)");
            }
        }

        return records.stream().map(RunningRecordResponse::from).toList();
    }
}
