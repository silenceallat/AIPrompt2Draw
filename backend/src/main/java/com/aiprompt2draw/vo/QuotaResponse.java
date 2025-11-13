package com.aiprompt2draw.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 额度查询响应VO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "额度查询响应")
public class QuotaResponse {

    @Schema(description = "剩余额度")
    private Integer remainingQuota;

    @Schema(description = "总额度")
    private Integer totalQuota;

    @Schema(description = "Key类型: trial-试用, paid-付费, vip-VIP")
    private String keyType;

    @Schema(description = "过期时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expireTime;
}
