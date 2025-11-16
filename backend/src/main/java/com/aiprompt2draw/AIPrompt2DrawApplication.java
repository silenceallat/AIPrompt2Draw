package com.aiprompt2draw;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * AIPrompt2Draw后端应用主类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@SpringBootApplication
@MapperScan("com.aiprompt2draw.mapper")
@EnableAsync
public class AIPrompt2DrawApplication {

    public static void main(String[] args) {
        SpringApplication.run(AIPrompt2DrawApplication.class, args);
        System.out.println("\n" +
            "========================================\n" +
            "AIPrompt2Draw Backend Started Successfully!\n" +
            "API Documentation: http://localhost:8080\n" +
            "========================================\n");
    }
}
