package com.aiprompt2draw.adapter.impl;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aiprompt2draw.adapter.AIModelAdapter;
import com.aiprompt2draw.constant.FlowchartPromptTemplate;
import com.aiprompt2draw.dto.AIResponse;
import com.aiprompt2draw.entity.ModelConfig;
import com.aiprompt2draw.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * OpenAI模型适配器
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Component
public class OpenAIAdapter implements AIModelAdapter {

    @Value("${app.ai.request-timeout:30000}")
    private int requestTimeout;

    @Override
    public AIResponse generateFlowchart(String prompt, ModelConfig config) {
        long startTime = System.currentTimeMillis();

        try {
            // 构建请求体
            JSONObject requestBody = buildRequestBody(prompt, config);

            // 发送请求
            HttpResponse response = HttpRequest.post(config.getApiUrl())
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(requestBody.toString())
                    .timeout(requestTimeout)
                    .execute();

            long responseTime = System.currentTimeMillis() - startTime;

            // 检查响应状态
            if (!response.isOk()) {
                log.error("OpenAI API调用失败: status={}, body={}", response.getStatus(), response.body());
                throw new BusinessException("AI服务调用失败: " + response.getStatus());
            }

            // 解析响应
            JSONObject responseBody = JSONUtil.parseObj(response.body());

            // 提取内容
            String xmlContent = extractContent(responseBody);

            // 提取Token使用情况
            JSONObject usage = responseBody.getJSONObject("usage");
            Integer promptTokens = usage != null ? usage.getInt("prompt_tokens") : 0;
            Integer completionTokens = usage != null ? usage.getInt("completion_tokens") : 0;
            Integer totalTokens = usage != null ? usage.getInt("total_tokens") : 0;

            // 构建响应
            AIResponse aiResponse = new AIResponse();
            aiResponse.setXmlContent(xmlContent);
            aiResponse.setPromptTokens(promptTokens);
            aiResponse.setCompletionTokens(completionTokens);
            aiResponse.setTotalTokens(totalTokens);
            aiResponse.setResponseTime(responseTime);

            log.info("OpenAI调用成功: model={}, tokens={}, time={}ms",
                    config.getModelName(), totalTokens, responseTime);

            return aiResponse;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("OpenAI调用异常", e);
            throw new BusinessException("AI服务调用异常: " + e.getMessage());
        }
    }

    @Override
    public String getModelType() {
        return "openai";
    }

    /**
     * 构建请求体
     */
    private JSONObject buildRequestBody(String prompt, ModelConfig config) {
        JSONObject requestBody = new JSONObject();
        requestBody.set("model", config.getModelName());

        // 构建消息
        JSONObject systemMessage = new JSONObject();
        systemMessage.set("role", "system");
        systemMessage.set("content", FlowchartPromptTemplate.SYSTEM_PROMPT);

        JSONObject userMessage = new JSONObject();
        userMessage.set("role", "user");
        userMessage.set("content", FlowchartPromptTemplate.buildUserPrompt(prompt));

        requestBody.set("messages", new Object[]{systemMessage, userMessage});
        requestBody.set("max_tokens", config.getMaxTokens());
        requestBody.set("temperature", config.getTemperature());

        return requestBody;
    }

    /**
     * 提取响应内容
     */
    private String extractContent(JSONObject responseBody) {
        try {
            String content = responseBody
                    .getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getStr("content");

            if (content == null || content.isBlank()) {
                throw new BusinessException("AI返回内容为空");
            }

            // 清理内容(移除可能的markdown标记)
            content = content.trim();
            if (content.startsWith("```xml")) {
                content = content.substring(6);
            }
            if (content.startsWith("```")) {
                content = content.substring(3);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }

            return content.trim();

        } catch (Exception e) {
            log.error("解析OpenAI响应失败: {}", responseBody);
            throw new BusinessException("AI响应解析失败");
        }
    }
}
