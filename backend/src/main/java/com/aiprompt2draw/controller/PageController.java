package com.aiprompt2draw.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 页面路由控制器
 * 负责前端页面的路由和静态资源访问
 */
@Controller
public class PageController {

    /**
     * 主页面路由
     * 返回集成的AIPrompt2Draw前端页面
     */
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    /**
     * 健康检查页面
     */
    @GetMapping("/health")
    public String health() {
        return "forward:/index.html";
    }
}