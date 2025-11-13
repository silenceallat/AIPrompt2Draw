package com.aiprompt2draw.service;

import com.aiprompt2draw.constant.RedisKeyConstant;
import com.aiprompt2draw.entity.ModelConfig;
import com.aiprompt2draw.exception.BusinessException;
import com.aiprompt2draw.mapper.ModelConfigMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 模型配置服务
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ModelConfigService {

    private final ModelConfigMapper modelConfigMapper;
    private final StringRedisTemplate redisTemplate;

    /**
     * 根据模型类型获取配置
     *
     * @param modelType 模型类型
     * @return 模型配置
     */
    public ModelConfig getByModelType(String modelType) {
        // 先从缓存获取
        String cacheKey = RedisKeyConstant.MODEL_CONFIG_PREFIX + modelType;

        // 从数据库查询
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModelConfig::getModelType, modelType)
                .eq(ModelConfig::getStatus, 1)
                .orderByDesc(ModelConfig::getPriority)
                .last("LIMIT 1");

        ModelConfig config = modelConfigMapper.selectOne(wrapper);

        if (config == null) {
            throw new BusinessException("模型配置不存在或未启用: " + modelType);
        }

        // 写入缓存
        redisTemplate.opsForValue().set(cacheKey, "cached", 30, TimeUnit.MINUTES);

        return config;
    }

    /**
     * 获取默认模型配置
     *
     * @return 默认模型配置
     */
    public ModelConfig getDefaultConfig() {
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModelConfig::getStatus, 1)
                .orderByDesc(ModelConfig::getPriority)
                .last("LIMIT 1");

        ModelConfig config = modelConfigMapper.selectOne(wrapper);

        if (config == null) {
            throw new BusinessException("没有可用的模型配置,请联系管理员");
        }

        return config;
    }
}
