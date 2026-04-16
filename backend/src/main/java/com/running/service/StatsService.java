package com.running.service;

import com.running.dto.StatsSummaryResponse;
import com.running.entity.RunningRecord;
import com.running.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final RunningRecordRepository runningRecordRepository;

    public StatsSummaryResponse getSummary(Long userId) {
        List<RunningRecord> records = (userId != null)
                ? runningRecordRepository.findByUserIdOrderByDateDesc(userId)
                : runningRecordRepository.findAll();

        double totalDistance = records.stream()
                .mapToDouble(r -> r.getDistanceKm() != null ? r.getDistanceKm() : 0.0)
                .sum();
        totalDistance = Math.round(totalDistance * 100.0) / 100.0;

        int totalDuration = records.stream()
                .filter(r -> r.getDurationSeconds() != null)
                .mapToInt(RunningRecord::getDurationSeconds)
                .sum();

        Double avgPace = null;
        if (totalDuration > 0 && totalDistance > 0) {
            avgPace = Math.round(totalDuration / 60.0 / totalDistance * 100.0) / 100.0;
        }

        return StatsSummaryResponse.builder()
                .totalDistanceKm(totalDistance)
                .totalDurationSeconds(totalDuration)
                .totalCount((long) records.size())
                .averagePaceMinPerKm(avgPace)
                .build();
    }
}
