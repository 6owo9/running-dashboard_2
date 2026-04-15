package com.running.repository;

import com.running.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    Optional<Goal> findTopByUserIdOrderByCreatedAtDesc(Long userId);
}
