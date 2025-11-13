package com.aiprompt2draw.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI响应DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIResponse {

    /**
     * 生成的XML内容
     */
    private String xmlContent;

    /**
     * 输入Token数
     */
    private Integer promptTokens;

    /**
     * 输出Token数
     */
    private Integer completionTokens;

    /**
     * 总Token数
     */
    private Integer totalTokens;

    /**
     * 响应时间(毫秒)
     */
    private Long responseTime;
}
