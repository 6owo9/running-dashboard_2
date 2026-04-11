package com.running.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * add-mappings: false 로 자동 설정이 꺼져 있으므로 정적 파일 핸들러를 명시적으로 등록
     * Vite 빌드 결과물 구조: /assets/** + 루트 정적 파일들
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/");
        registry.addResourceHandler("/*.js", "/*.css", "/*.html", "/*.ico", "/*.svg", "/*.png", "/*.txt")
                .addResourceLocations("classpath:/static/");
    }
}
