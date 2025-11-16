package com.aiprompt2draw.dto;


import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建API Key请求DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
public class CreateApiKeyRequest {

    @NotNull(message = "Key类型不能为空")
    private Integer keyType;

    @NotNull(message = "额度不能为空")
    @Min(value = 1, message = "额度必须大于0")
    private Integer quota;

    @NotNull(message = "限流次数不能为空")
    @Min(value = 1, message = "限流次数必须大于0")
    private Integer rateLimit;

    private Integer expireDays;

    private String remark;
}
