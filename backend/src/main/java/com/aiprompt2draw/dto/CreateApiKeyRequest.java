package com.aiprompt2draw.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建API Key请求DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@Schema(description = "创建API Key请求")
public class CreateApiKeyRequest {

    @NotNull(message = "Key类型不能为空")
    @Schema(description = "Key类型: 1-试用 2-付费 3-VIP", required = true, example = "1")
    private Integer keyType;

    @NotNull(message = "额度不能为空")
    @Min(value = 1, message = "额度必须大于0")
    @Schema(description = "额度(次数)", required = true, example = "100")
    private Integer quota;

    @NotNull(message = "限流次数不能为空")
    @Min(value = 1, message = "限流次数必须大于0")
    @Schema(description = "每分钟请求限制", required = true, example = "10")
    private Integer rateLimit;

    @Schema(description = "过期天数(不填则永久有效)", example = "30")
    private Integer expireDays;

    @Schema(description = "备注信息", example = "B站推广活动")
    private String remark;
}
