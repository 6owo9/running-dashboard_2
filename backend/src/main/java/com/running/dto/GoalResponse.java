package com.running.dto;

import com.running.entity.Goal;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GoalResponse {

    private Long id;
    private Double targetDistanceKm;
    private Double achievedDistanceKm;
    private Double progressRate;
    private LocalDateTime createdAt;

    public static GoalResponse of(Goal goal, double achievedDistanceKm) {
        double progress = Math.min(achievedDistanceKm / goal.getTargetDistanceKm() * 100.0, 100.0);
        progress = Math.round(progress * 10.0) / 10.0;

        return GoalResponse.builder()
                .id(goal.getId())
                .targetDistanceKm(goal.getTargetDistanceKm())
                .achievedDistanceKm(Math.round(achievedDistanceKm * 100.0) / 100.0)
                .progressRate(progress)
                .createdAt(goal.getCreatedAt())
                .build();
    }
}
