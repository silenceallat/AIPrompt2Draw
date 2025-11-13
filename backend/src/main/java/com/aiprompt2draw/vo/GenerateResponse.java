package com.aiprompt2draw.vo;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "生成流程图响应")
public class GenerateResponse {

    @Schema(description = "生成的XML内容")
    private String xml;

    @Schema(description = "剩余额度")
    private Integer remainingQuota;

    @Schema(description = "使用的模型")
    private String modelUsed;

    @Schema(description = "消耗的Token数")
    private Integer tokensUsed;
}
