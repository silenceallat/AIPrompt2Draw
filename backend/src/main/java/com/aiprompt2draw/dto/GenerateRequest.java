package com.aiprompt2draw.dto;


import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;

/**
 * 生成流程图请求DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
public class GenerateRequest {

    @NotBlank(message = "输入描述不能为空")
    @Size(max = 2000, message = "输入描述不能超过2000字符")
    private String prompt;

    private String modelType;
}
