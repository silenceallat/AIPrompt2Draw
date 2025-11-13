package com.aiprompt2draw.service;

import com.aiprompt2draw.constant.RedisKeyConstant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RRateLimiter;
import org.redisson.api.RateIntervalUnit;
import org.redisson.api.RateType;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

/**
 * 限流服务
 * <p>
 * 基于Redisson实现分布式限流
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final RedissonClient redissonClient;

    /**
     * 检查API Key限流
     *
     * @param apiKey    API Key
     * @param rateLimit 每分钟允许的请求次数
     * @return true-允许请求, false-超过限流
     */
    public boolean tryAcquire(String apiKey, int rateLimit) {
        String rateLimitKey = RedisKeyConstant.RATE_LIMIT_PREFIX + apiKey;
        RRateLimiter rateLimiter = redissonClient.getRateLimiter(rateLimitKey);

        // 设置限流规则: rateLimit次/分钟
        rateLimiter.trySetRate(RateType.OVERALL, rateLimit, 1, RateIntervalUnit.MINUTES);

        // 尝试获取许可
        boolean acquired = rateLimiter.tryAcquire(1);

        if (!acquired) {
            log.warn("API Key限流触发: {}, 限制: {}次/分钟", apiKey, rateLimit);
        }

        return acquired;
    }

    /**
     * 检查IP限流
     *
     * @param ip        IP地址
     * @param rateLimit 每小时允许的请求次数
     * @return true-允许请求, false-超过限流
     */
    public boolean tryAcquireByIp(String ip, int rateLimit) {
        String rateLimitKey = RedisKeyConstant.IP_RATE_LIMIT_PREFIX + ip;
        RRateLimiter rateLimiter = redissonClient.getRateLimiter(rateLimitKey);

        // 设置限流规则: rateLimit次/小时
        rateLimiter.trySetRate(RateType.OVERALL, rateLimit, 1, RateIntervalUnit.HOURS);

        // 尝试获取许可
        boolean acquired = rateLimiter.tryAcquire(1);

        if (!acquired) {
            log.warn("IP限流触发: {}, 限制: {}次/小时", ip, rateLimit);
        }

        return acquired;
    }

    /**
     * 获取剩余可用次数
     *
     * @param apiKey API Key
     * @return 剩余次数
     */
    public long getAvailablePermits(String apiKey) {
        String rateLimitKey = RedisKeyConstant.RATE_LIMIT_PREFIX + apiKey;
        RRateLimiter rateLimiter = redissonClient.getRateLimiter(rateLimitKey);

        return rateLimiter.availablePermits();
    }
}
