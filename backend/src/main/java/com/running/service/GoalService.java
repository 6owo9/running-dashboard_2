package com.running.service;

import com.running.dto.GoalRequest;
import com.running.dto.GoalResponse;
import com.running.entity.Goal;
import com.running.repository.GoalRepository;
import com.running.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final RunningRecordRepository runningRecordRepository;

    public GoalResponse saveGoal(GoalRequest request) {
        Goal goal = new Goal();
        goal.setMonthlyDistanceKm(request.getMonthlyDistanceKm());
        Goal saved = goalRepository.save(goal);
        return toResponse(saved);
    }

    public GoalResponse getCurrentGoal() {
        Goal goal = goalRepository.findTopByOrderByCreatedAtDesc()
                .orElseThrow(() -> new NoSuchElementException("설정된 목표가 없습니다."));
        return toResponse(goal);
    }

    private GoalResponse toResponse(Goal goal) {
        // 이번 달 달성 거리 합산
        LocalDate firstDay = LocalDate.now().withDayOfMonth(1);
        LocalDate today = LocalDate.now();
        double currentDistanceKm = runningRecordRepository
                .findByRunDateBetween(firstDay, today)
                .stream()
                .mapToDouble(r -> r.getDistanceKm())
                .sum();

        double rate = goal.getMonthlyDistanceKm() == 0 ? 0
                : Math.min(currentDistanceKm / goal.getMonthlyDistanceKm() * 100, 100);

        return GoalResponse.builder()
                .id(goal.getId())
                .monthlyDistanceKm(goal.getMonthlyDistanceKm())
                .currentDistanceKm(currentDistanceKm)
                .achievementRate(Math.round(rate * 10) / 10.0)
                .build();
    }
}
