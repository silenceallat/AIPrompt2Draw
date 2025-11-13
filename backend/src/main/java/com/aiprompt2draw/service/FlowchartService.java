package com.aiprompt2draw.service;

import cn.hutool.core.util.StrUtil;
import com.aiprompt2draw.adapter.AIModelAdapter;
import com.aiprompt2draw.adapter.AIModelFactory;
import com.aiprompt2draw.dto.AIResponse;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.entity.ModelConfig;
import com.aiprompt2draw.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 流程图生成服务
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FlowchartService {

    private final ApiKeyService apiKeyService;
    private final RateLimitService rateLimitService;
    private final ModelConfigService modelConfigService;
    private final AIModelFactory aiModelFactory;
    private final UsageRecordService usageRecordService;

    @Value("${app.ai.default-model-type:openai}")
    private String defaultModelType;

    /**
     * 生成流程图
     *
     * @param apiKeyValue API Key
     * @param prompt      用户输入
     * @param modelType   模型类型(可选)
     * @param ipAddress   IP地址
     * @param userAgent   用户代理
     * @return AI响应
     */
    public AIResponse generate(String apiKeyValue, String prompt, String modelType,
                                String ipAddress, String userAgent) {
        // 1. 验证API Key
        ApiKey apiKey = apiKeyService.validateApiKey(apiKeyValue);

        // 2. 检查限流
        if (!rateLimitService.tryAcquire(apiKeyValue, apiKey.getRateLimit())) {
            throw new BusinessException(429, "请求过于频繁,请稍后再试");
        }

        // 3. 验证输入
        if (StrUtil.isBlank(prompt)) {
            throw new BusinessException(400, "输入描述不能为空");
        }

        if (prompt.length() > 2000) {
            throw new BusinessException(400, "输入描述不能超过2000字符");
        }

        // 4. 检查并扣减额度
        if (!apiKeyService.checkAndDeductQuota(apiKeyValue)) {
            throw new BusinessException(403, "额度不足,请联系管理员");
        }

        // 5. 获取模型配置
        ModelConfig modelConfig;
        if (StrUtil.isNotBlank(modelType)) {
            modelConfig = modelConfigService.getByModelType(modelType);
        } else {
            modelConfig = modelConfigService.getByModelType(defaultModelType);
        }

        // 6. 获取适配器
        AIModelAdapter adapter = aiModelFactory.getAdapter(modelConfig.getModelType());

        AIResponse aiResponse;
        try {
            // 7. 调用AI生成
            aiResponse = adapter.generateFlowchart(prompt, modelConfig);

            // 8. 异步保存成功记录
            usageRecordService.saveSuccessRecord(
                    apiKey, modelConfig, prompt, aiResponse, ipAddress, userAgent
            );

            log.info("流程图生成成功: apiKey={}, model={}, tokens={}",
                    apiKeyValue, modelConfig.getModelType(), aiResponse.getTotalTokens());

            return aiResponse;

        } catch (Exception e) {
            // 9. 异步保存失败记录
            usageRecordService.saveErrorRecord(
                    apiKey, modelConfig, prompt, e.getMessage(), ipAddress, userAgent
            );

            log.error("流程图生成失败: apiKey={}, error={}", apiKeyValue, e.getMessage());

            // 由于已经扣减了额度，这里不回退额度，避免滥用
            // 如果需要回退，可以在这里实现

            throw e;
        }
    }
}
