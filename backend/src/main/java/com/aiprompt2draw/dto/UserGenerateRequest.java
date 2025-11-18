package com.aiprompt2draw.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;

/**
 * 用户生成流程图请求DTO
 * 支持JWT认证的用户流程图生成
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
public class UserGenerateRequest {

    @NotBlank(message = "输入描述不能为空")
    @Size(max = 2000, message = "输入描述不能超过2000字符")
    private String prompt;

    /**
     * AI服务商
     */
    private String provider;

    /**
     * AI模型
     */
    private String model;

    /**
     * 是否启用流式输出
     */
    private Boolean stream = true;

    /**
     * 温度参数
     */
    private Float temperature = 0.7f;

    /**
     * 最大token数
     */
    private Integer maxTokens = 2000;

    /**
     * 是否发送对话历史
     */
    private Boolean sendHistory = true;

    /**
     * 对话历史记录
     */
    private java.util.List<ConversationMessage> conversationHistory;

    /**
     * 对话消息
     */
    @Data
    public static class ConversationMessage {
        private String role; // user, assistant, system
        private String content;
        private String timestamp;
    }
}