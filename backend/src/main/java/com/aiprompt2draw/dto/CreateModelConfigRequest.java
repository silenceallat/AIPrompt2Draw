package com.aiprompt2draw.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * 创建模型配置请求DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
public class CreateModelConfigRequest {

    @NotBlank(message = "模型类型不能为空")
    private String modelType;

    @NotBlank(message = "模型名称不能为空")
    private String modelName;

    @NotBlank(message = "API Key不能为空")
    private String apiKey;

    @NotBlank(message = "API地址不能为空")
    private String apiUrl;

    private String apiSecret;

    @Positive(message = "最大Token数必须大于0")
    private Integer maxTokens;

    private BigDecimal temperature;

    @NotNull(message = "优先级不能为空")
    private Integer priority;

    private BigDecimal costPer1kPromptTokens;

    private BigDecimal costPer1kCompletionTokens;

    private String remark;
}