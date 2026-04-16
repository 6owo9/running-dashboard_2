package com.running.repository;

import com.running.entity.RunningRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RunningRecordRepository extends JpaRepository<RunningRecord, Long> {
    List<RunningRecord> findAllByOrderByDateDesc();
    boolean existsByTitleAndUserId(String title, Long userId);
    List<RunningRecord> findByUserIdOrderByDateDesc(Long userId);
    List<RunningRecord> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate start, LocalDate end);
}
