package com.running.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class RunningRecordResponse {

    private Long id;
    private String title;
    private LocalDate runDate;
    private double distanceKm;
    private Integer durationSeconds;
    private List<double[]> coordinates;
    private LocalDateTime createdAt;
}
