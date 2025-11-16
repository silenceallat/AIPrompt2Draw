package com.aiprompt2draw.vo;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 生成流程图响应VO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateResponse {

    private String xml;

    private Integer remainingQuota;

    private String modelUsed;

    private Integer tokensUsed;
}
