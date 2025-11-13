package com.aiprompt2draw.service;

import cn.hutool.core.util.StrUtil;
import com.aiprompt2draw.dto.AIResponse;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.entity.ModelConfig;
import com.aiprompt2draw.entity.UsageRecord;
import com.aiprompt2draw.mapper.UsageRecordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 使用记录服务
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsageRecordService {

    private final UsageRecordMapper usageRecordMapper;

    /**
     * 异步保存成功记录
     *
     * @param apiKey      API Key实体
     * @param modelConfig 模型配置
     * @param prompt      用户输入
     * @param aiResponse  AI响应
     * @param ipAddress   IP地址
     * @param userAgent   用户代理
     */
    @Async
    public void saveSuccessRecord(ApiKey apiKey, ModelConfig modelConfig, String prompt,
                                   AIResponse aiResponse, String ipAddress, String userAgent) {
        try {
            UsageRecord record = new UsageRecord();
            record.setApiKeyId(apiKey.getId());
            record.setKeyValue(apiKey.getKeyValue());
            record.setModelType(modelConfig.getModelType());
            record.setModelName(modelConfig.getModelName());

            // 输入文本截断(超过100字)
            record.setInputText(truncateText(prompt, 100));

            // 输出XML(不超过65535字符)
            record.setOutputXml(truncateText(aiResponse.getXmlContent(), 65535));

            record.setPromptTokens(aiResponse.getPromptTokens());
            record.setCompletionTokens(aiResponse.getCompletionTokens());
            record.setTotalTokens(aiResponse.getTotalTokens());

            // 计算成本
            BigDecimal cost = calculateCost(
                    aiResponse.getPromptTokens(),
                    aiResponse.getCompletionTokens(),
                    modelConfig.getCostPer1kPromptTokens(),
                    modelConfig.getCostPer1kCompletionTokens()
            );
            record.setCost(cost);

            record.setResponseTime(aiResponse.getResponseTime().intValue());
            record.setStatus(1);  // 成功
            record.setIpAddress(ipAddress);
            record.setUserAgent(truncateText(userAgent, 512));

            usageRecordMapper.insert(record);

            log.info("保存使用记录成功: apiKey={}, model={}, tokens={}",
                    apiKey.getKeyValue(), modelConfig.getModelType(), aiResponse.getTotalTokens());

        } catch (Exception e) {
            log.error("保存使用记录失败", e);
        }
    }

    /**
     * 异步保存失败记录
     *
     * @param apiKey      API Key实体
     * @param modelConfig 模型配置
     * @param prompt      用户输入
     * @param errorMsg    错误信息
     * @param ipAddress   IP地址
     * @param userAgent   用户代理
     */
    @Async
    public void saveErrorRecord(ApiKey apiKey, ModelConfig modelConfig, String prompt,
                                 String errorMsg, String ipAddress, String userAgent) {
        try {
            UsageRecord record = new UsageRecord();
            record.setApiKeyId(apiKey != null ? apiKey.getId() : 0L);
            record.setKeyValue(apiKey != null ? apiKey.getKeyValue() : "unknown");
            record.setModelType(modelConfig != null ? modelConfig.getModelType() : "unknown");
            record.setModelName(modelConfig != null ? modelConfig.getModelName() : "unknown");
            record.setInputText(truncateText(prompt, 100));
            record.setStatus(0);  // 失败
            record.setErrorMsg(truncateText(errorMsg, 1000));
            record.setIpAddress(ipAddress);
            record.setUserAgent(truncateText(userAgent, 512));

            usageRecordMapper.insert(record);

            log.info("保存错误记录成功: apiKey={}, error={}",
                    apiKey != null ? apiKey.getKeyValue() : "unknown", errorMsg);

        } catch (Exception e) {
            log.error("保存错误记录失败", e);
        }
    }

    /**
     * 截断文本
     */
    private String truncateText(String text, int maxLength) {
        if (StrUtil.isBlank(text)) {
            return null;
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }

    /**
     * 计算成本
     */
    private BigDecimal calculateCost(Integer promptTokens, Integer completionTokens,
                                      BigDecimal costPer1kPrompt, BigDecimal costPer1kCompletion) {
        if (promptTokens == null || completionTokens == null
                || costPer1kPrompt == null || costPer1kCompletion == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal promptCost = BigDecimal.valueOf(promptTokens)
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP)
                .multiply(costPer1kPrompt);

        BigDecimal completionCost = BigDecimal.valueOf(completionTokens)
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP)
                .multiply(costPer1kCompletion);

        return promptCost.add(completionCost);
    }
}
