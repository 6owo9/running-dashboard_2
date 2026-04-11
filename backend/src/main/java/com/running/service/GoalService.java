package com.running.service;

import com.running.dto.GoalRequest;
import com.running.dto.GoalResponse;
import com.running.entity.Goal;
import com.running.repository.GoalRepository;
import com.running.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class GoalService {

    private final GoalRepository goalRepository;
    private final RunningRecordRepository runningRecordRepository;

    public GoalResponse save(GoalRequest request) {
        if (request.getTargetDistanceKm() == null || request.getTargetDistanceKm() <= 0) {
            throw new IllegalArgumentException("올바른 거리(km)를 입력해주세요.");
        }

        Goal goal = Goal.builder()
                .targetDistanceKm(request.getTargetDistanceKm())
                .build();

        return GoalResponse.of(goalRepository.save(goal), achievedDistance());
    }

    @Transactional(readOnly = true)
    public GoalResponse getCurrent() {
        return goalRepository.findTopByOrderByCreatedAtDesc()
                .map(goal -> GoalResponse.of(goal, achievedDistance()))
                .orElse(null);
    }

    private double achievedDistance() {
        return runningRecordRepository.findAll().stream()
                .mapToDouble(r -> r.getDistanceKm() != null ? r.getDistanceKm() : 0.0)
                .sum();
    }
}
