package com.running.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "running_record")
@Getter
@Setter
@NoArgsConstructor
public class RunningRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(nullable = false)
    private LocalDate runDate;

    @Column(nullable = false)
    private double distanceKm;

    private Integer durationSeconds;

    // 좌표 배열을 JSON 문자열로 저장 ([[lat,lng], ...])
    @Column(columnDefinition = "TEXT")
    private String coordinates;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
