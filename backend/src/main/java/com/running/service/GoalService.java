package com.running.service;

import com.running.dto.GoalRequest;
import com.running.dto.GoalResponse;
import com.running.entity.Goal;
import com.running.repository.GoalRepository;
import com.running.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class GoalService {

    private final GoalRepository goalRepository;
    private final RunningRecordRepository runningRecordRepository;

    public GoalResponse save(Long userId, GoalRequest request) {
        if (request.getTargetDistanceKm() == null || request.getTargetDistanceKm() <= 0) {
            throw new IllegalArgumentException("올바른 거리(km)를 입력해주세요.");
        }

        Goal goal = Goal.builder()
                .targetDistanceKm(request.getTargetDistanceKm())
                .userId(userId)
                .build();

        return GoalResponse.of(goalRepository.save(goal), achievedDistance(userId));
    }

    @Transactional(readOnly = true)
    public GoalResponse getCurrent(Long userId) {
        if (userId == null) return null;
        return goalRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(goal -> GoalResponse.of(goal, achievedDistance(userId)))
                .orElse(null);
    }

    private double achievedDistance(Long userId) {
        LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate today = LocalDate.now();
        return runningRecordRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, firstOfMonth, today)
                .stream()
                .mapToDouble(r -> r.getDistanceKm() != null ? r.getDistanceKm() : 0.0)
                .sum();
    }
}
