package com.running.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StatsSummaryResponse {
    private Double totalDistanceKm;
    private Integer totalDurationSeconds;
    private Long totalCount;
    private Double averagePaceMinPerKm;
}
