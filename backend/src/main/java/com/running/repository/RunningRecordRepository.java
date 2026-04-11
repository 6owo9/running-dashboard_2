package com.running.repository;

import com.running.entity.RunningRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RunningRecordRepository extends JpaRepository<RunningRecord, Long> {
    List<RunningRecord> findByDateOrderByCreatedAtDesc(LocalDate date);
    List<RunningRecord> findByDateBetweenOrderByDateDesc(LocalDate start, LocalDate end);
    List<RunningRecord> findAllByOrderByDateDesc();
    boolean existsByTitle(String title);
}
