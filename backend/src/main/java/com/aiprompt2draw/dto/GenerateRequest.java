package com.aiprompt2draw.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 生成流程图请求DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@Schema(description = "生成流程图请求")
public class GenerateRequest {

    @NotBlank(message = "输入描述不能为空")
    @Size(max = 2000, message = "输入描述不能超过2000字符")
    @Schema(description = "用户输入的描述文本", required = true, example = "设计一个用户登录流程")
    private String prompt;

    @Schema(description = "模型类型(可选)", example = "openai")
    private String modelType;
}
