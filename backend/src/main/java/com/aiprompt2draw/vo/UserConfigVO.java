package com.aiprompt2draw.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户配置VO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
public class UserConfigVO {

    /**
     * 配置ID
     */
    private Long id;

    /**
     * API Key ID
     */
    private Long apiKeyId;

    /**
     * 配置类型
     */
    private String configType;

    /**
     * 配置内容（JSON格式）
     */
    private String configContent;

    /**
     * 配置名称
     */
    private String configName;

    /**
     * 是否默认配置
     */
    private Boolean isDefault;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    /**
     * 备注
     */
    private String remark;
}