package com.running.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StatsSummaryResponse {

    private int totalRuns;
    private double totalDistanceKm;
    private double averageDistanceKm;
}
