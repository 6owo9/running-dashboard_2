package com.running.dto;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.running.entity.RunningRecord;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class RunningRecordResponse {

    private Long id;
    private String title;
    private LocalDate date;
    private Double distanceKm;
    private Integer durationSeconds;
    private Double paceMinPerKm;

    @JsonRawValue
    private String coordinates;

    private LocalDateTime createdAt;

    public static RunningRecordResponse from(RunningRecord record) {
        Double pace = null;
        if (record.getDurationSeconds() != null && record.getDistanceKm() > 0) {
            pace = Math.round(record.getDurationSeconds() / 60.0 / record.getDistanceKm() * 100.0) / 100.0;
        }

        return RunningRecordResponse.builder()
                .id(record.getId())
                .title(record.getTitle())
                .date(record.getDate())
                .distanceKm(record.getDistanceKm())
                .durationSeconds(record.getDurationSeconds())
                .paceMinPerKm(pace)
                .coordinates(record.getCoordinates())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
