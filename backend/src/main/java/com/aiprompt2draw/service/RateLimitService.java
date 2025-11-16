package com.aiprompt2draw.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 限流服务
 * <p>
 * 基于内存实现简单限流（演示用途）
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
public class RateLimitService {

    private final ConcurrentHashMap<String, AtomicInteger> apiKeyCounters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicInteger> ipCounters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lastResetTime = new ConcurrentHashMap<>();

    /**
     * 检查API Key限流
     *
     * @param apiKey    API Key
     * @param rateLimit 每分钟允许的请求次数
     * @return true-允许请求, false-超过限流
     */
    public boolean tryAcquire(String apiKey, int rateLimit) {
        long currentTime = System.currentTimeMillis();
        long oneMinuteAgo = currentTime - 60 * 1000;

        // 重置过期的计数器
        Long lastReset = lastResetTime.get(apiKey);
        if (lastReset == null || lastReset < oneMinuteAgo) {
            apiKeyCounters.put(apiKey, new AtomicInteger(0));
            lastResetTime.put(apiKey, currentTime);
        }

        AtomicInteger counter = apiKeyCounters.computeIfAbsent(apiKey, k -> new AtomicInteger(0));
        int currentCount = counter.incrementAndGet();

        if (currentCount > rateLimit) {
            log.warn("API Key限流触发: {}, 限制: {}次/分钟", apiKey, rateLimit);
            return false;
        }

        return true;
    }

    /**
     * 检查IP限流
     *
     * @param ip        IP地址
     * @param rateLimit 每小时允许的请求次数
     * @return true-允许请求, false-超过限流
     */
    public boolean tryAcquireByIp(String ip, int rateLimit) {
        long currentTime = System.currentTimeMillis();
        long oneHourAgo = currentTime - 60 * 60 * 1000;

        // 重置过期的计数器
        String ipKey = "ip_" + ip;
        Long lastReset = lastResetTime.get(ipKey);
        if (lastReset == null || lastReset < oneHourAgo) {
            ipCounters.put(ipKey, new AtomicInteger(0));
            lastResetTime.put(ipKey, currentTime);
        }

        AtomicInteger counter = ipCounters.computeIfAbsent(ipKey, k -> new AtomicInteger(0));
        int currentCount = counter.incrementAndGet();

        if (currentCount > rateLimit) {
            log.warn("IP限流触发: {}, 限制: {}次/小时", ip, rateLimit);
            return false;
        }

        return true;
    }

    /**
     * 获取剩余可用次数
     *
     * @param apiKey API Key
     * @return 剩余次数（简化实现，返回一个固定值）
     */
    public long getAvailablePermits(String apiKey) {
        // 简化实现，实际应用中可以根据需要计算剩余次数
        return 100L;
    }
}
