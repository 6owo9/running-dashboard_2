package com.running.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "running_record")
@Getter
@NoArgsConstructor
public class RunningRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Double distanceKm;

    private Integer durationSeconds;

    @Column(columnDefinition = "TEXT")
    private String coordinates;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public RunningRecord(String title, LocalDate date, Double distanceKm,
                         Integer durationSeconds, String coordinates) {
        this.title = title;
        this.date = date;
        this.distanceKm = distanceKm;
        this.durationSeconds = durationSeconds;
        this.coordinates = coordinates;
        this.createdAt = LocalDateTime.now();
    }
}
