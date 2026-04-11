package com.running.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GoalResponse {

    private Long id;
    private double monthlyDistanceKm;
    private double currentDistanceKm;
    private double achievementRate;
}
