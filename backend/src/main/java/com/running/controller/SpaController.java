package com.running.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * React Router 경로를 index.html로 포워딩
 * 새 화면 추가 시 여기에 경로를 함께 추가한다
 */
@Controller
public class SpaController {

    @GetMapping({"/", "/upload", "/goal"})
    public String spa() {
        return "forward:/index.html";
    }
}
