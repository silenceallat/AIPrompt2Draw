package com.aiprompt2draw.vo;

import com.fasterxml.jackson.annotation.JsonFormat;

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
public class QuotaResponse {

    private Integer remainingQuota;

    private Integer totalQuota;

    private String keyType;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expireTime;
}
