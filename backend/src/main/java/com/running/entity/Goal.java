package com.running.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "goal")
@Getter
@NoArgsConstructor
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double targetDistanceKm;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Long userId;

    @Builder
    public Goal(Double targetDistanceKm, Long userId) {
        this.targetDistanceKm = targetDistanceKm;
        this.userId = userId;
        this.createdAt = LocalDateTime.now();
    }
}
