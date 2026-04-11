package com.running.controller;

import com.running.dto.ApiResponse;
import com.running.dto.GoalRequest;
import com.running.dto.GoalResponse;
import com.running.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @PostMapping
    public ResponseEntity<ApiResponse<GoalResponse>> saveGoal(@RequestBody GoalRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(goalService.saveGoal(request)));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<GoalResponse>> getCurrentGoal() {
        return ResponseEntity.ok(ApiResponse.ok(goalService.getCurrentGoal()));
    }
}
