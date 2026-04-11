package com.running.service;

import com.running.dto.StatsSummaryResponse;
import com.running.entity.RunningRecord;
import com.running.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final RunningRecordRepository runningRecordRepository;

    public StatsSummaryResponse getSummary() {
        List<RunningRecord> all = runningRecordRepository.findAll();
        int totalRuns = all.size();
        double totalDistanceKm = all.stream().mapToDouble(RunningRecord::getDistanceKm).sum();
        double averageDistanceKm = totalRuns == 0 ? 0
                : Math.round(totalDistanceKm / totalRuns * 10) / 10.0;

        return StatsSummaryResponse.builder()
                .totalRuns(totalRuns)
                .totalDistanceKm(Math.round(totalDistanceKm * 10) / 10.0)
                .averageDistanceKm(averageDistanceKm)
                .build();
    }
}
