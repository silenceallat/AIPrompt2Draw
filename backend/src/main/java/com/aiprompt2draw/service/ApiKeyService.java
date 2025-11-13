package com.aiprompt2draw.service;

import cn.hutool.core.util.StrUtil;
import com.aiprompt2draw.constant.RedisKeyConstant;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.enums.ApiKeyStatus;
import com.aiprompt2draw.exception.BusinessException;
import com.aiprompt2draw.mapper.ApiKeyMapper;
import com.aiprompt2draw.utils.ApiKeyGenerator;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * API Key服务
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyMapper apiKeyMapper;
    private final StringRedisTemplate redisTemplate;

    /**
     * 创建API Key
     *
     * @param keyType    Key类型
     * @param quota      额度
     * @param rateLimit  限流次数
     * @param expireDays 过期天数
     * @param remark     备注
     * @return API Key实体
     */
    public ApiKey createApiKey(Integer keyType, Integer quota, Integer rateLimit,
                                Integer expireDays, String remark) {
        // 生成API Key
        String keyValue = ApiKeyGenerator.generate(keyType);

        // 计算过期时间
        LocalDateTime expireTime = expireDays != null && expireDays > 0
                ? LocalDateTime.now().plusDays(expireDays)
                : null;

        // 创建实体
        ApiKey apiKey = new ApiKey();
        apiKey.setKeyValue(keyValue);
        apiKey.setKeyType(keyType);
        apiKey.setQuota(quota);
        apiKey.setTotalQuota(quota);
        apiKey.setStatus(ApiKeyStatus.ENABLED.getCode());
        apiKey.setRateLimit(rateLimit);
        apiKey.setExpireTime(expireTime);
        apiKey.setRemark(remark);

        // 保存到数据库
        apiKeyMapper.insert(apiKey);

        // 写入Redis缓存
        String quotaKey = RedisKeyConstant.QUOTA_PREFIX + keyValue;
        redisTemplate.opsForValue().set(quotaKey, String.valueOf(quota), 5, TimeUnit.MINUTES);

        log.info("创建API Key成功: {}, 类型: {}, 额度: {}", keyValue, keyType, quota);

        return apiKey;
    }

    /**
     * 验证API Key
     *
     * @param keyValue API Key值
     * @return API Key实体
     */
    public ApiKey validateApiKey(String keyValue) {
        if (StrUtil.isBlank(keyValue)) {
            throw new BusinessException(401, "API Key不能为空");
        }

        // 验证格式
        if (!ApiKeyGenerator.isValidFormat(keyValue)) {
            throw new BusinessException(401, "API Key格式不正确");
        }

        // 先从缓存获取
        String cacheKey = RedisKeyConstant.API_KEY_VALID_PREFIX + keyValue;
        String cached = redisTemplate.opsForValue().get(cacheKey);

        ApiKey apiKey;

        if (cached != null) {
            // 缓存存在，判断是否有效
            if ("invalid".equals(cached)) {
                throw new BusinessException(401, "无效的API Key");
            }

            // 从数据库查询完整信息
            apiKey = getApiKeyByValue(keyValue);
        } else {
            // 缓存不存在，从数据库查询
            apiKey = getApiKeyByValue(keyValue);

            if (apiKey == null) {
                // 缓存无效标记
                redisTemplate.opsForValue().set(cacheKey, "invalid", 5, TimeUnit.MINUTES);
                throw new BusinessException(401, "无效的API Key");
            }

            // 缓存有效标记
            redisTemplate.opsForValue().set(cacheKey, "valid", 5, TimeUnit.MINUTES);
        }

        // 验证状态
        if (!ApiKeyStatus.ENABLED.getCode().equals(apiKey.getStatus())) {
            throw new BusinessException(403, "API Key已被禁用或已过期");
        }

        // 验证是否过期
        if (apiKey.getExpireTime() != null && LocalDateTime.now().isAfter(apiKey.getExpireTime())) {
            // 更新状态为已过期
            apiKey.setStatus(ApiKeyStatus.EXPIRED.getCode());
            apiKeyMapper.updateById(apiKey);

            // 清除缓存
            redisTemplate.delete(cacheKey);

            throw new BusinessException(403, "API Key已过期");
        }

        // 验证额度
        if (apiKey.getQuota() <= 0) {
            throw new BusinessException(403, "额度不足,请联系管理员");
        }

        return apiKey;
    }

    /**
     * 根据Key值查询
     *
     * @param keyValue Key值
     * @return API Key实体
     */
    public ApiKey getApiKeyByValue(String keyValue) {
        LambdaQueryWrapper<ApiKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApiKey::getKeyValue, keyValue);
        return apiKeyMapper.selectOne(wrapper);
    }

    /**
     * 检查并扣减额度
     *
     * @param keyValue API Key值
     * @return 是否成功
     */
    public boolean checkAndDeductQuota(String keyValue) {
        String quotaKey = RedisKeyConstant.QUOTA_PREFIX + keyValue;

        // 1. 从Redis获取额度
        String quotaStr = redisTemplate.opsForValue().get(quotaKey);

        if (quotaStr == null) {
            // 2. Redis不存在,从MySQL加载
            ApiKey apiKey = getApiKeyByValue(keyValue);
            if (apiKey == null || apiKey.getQuota() <= 0) {
                return false;
            }
            // 回写Redis
            redisTemplate.opsForValue().set(quotaKey,
                    String.valueOf(apiKey.getQuota()), 5, TimeUnit.MINUTES);
            quotaStr = String.valueOf(apiKey.getQuota());
        }

        int quota = Integer.parseInt(quotaStr);
        if (quota <= 0) {
            return false;
        }

        // 3. 原子扣减
        Long newQuota = redisTemplate.opsForValue().decrement(quotaKey);

        // 4. 异步更新MySQL
        asyncDeductQuota(keyValue);

        return newQuota != null && newQuota >= 0;
    }

    /**
     * 异步扣减额度(MySQL)
     *
     * @param keyValue API Key值
     */
    @Async
    public void asyncDeductQuota(String keyValue) {
        CompletableFuture.runAsync(() -> {
            try {
                apiKeyMapper.deductQuota(keyValue, 1);
            } catch (Exception e) {
                log.error("异步扣减额度失败: {}", keyValue, e);
            }
        });
    }

    /**
     * 获取剩余额度
     *
     * @param keyValue API Key值
     * @return 剩余额度
     */
    public Integer getQuota(String keyValue) {
        String quotaKey = RedisKeyConstant.QUOTA_PREFIX + keyValue;
        String quotaStr = redisTemplate.opsForValue().get(quotaKey);

        if (quotaStr != null) {
            return Integer.parseInt(quotaStr);
        }

        ApiKey apiKey = getApiKeyByValue(keyValue);
        if (apiKey != null) {
            // 回写缓存
            redisTemplate.opsForValue().set(quotaKey,
                    String.valueOf(apiKey.getQuota()), 5, TimeUnit.MINUTES);
            return apiKey.getQuota();
        }

        return 0;
    }

    /**
     * 清除API Key缓存
     *
     * @param keyValue API Key值
     */
    public void clearCache(String keyValue) {
        String validKey = RedisKeyConstant.API_KEY_VALID_PREFIX + keyValue;
        String quotaKey = RedisKeyConstant.QUOTA_PREFIX + keyValue;
        redisTemplate.delete(validKey);
        redisTemplate.delete(quotaKey);
    }
}
