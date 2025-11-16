package com.aiprompt2draw.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 用户配置DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
public class UserConfigDTO {

    /**
     * 配置ID
     */
    private Long id;

    /**
     * 配置类型
     */
    @NotBlank(message = "配置类型不能为空")
    @Size(max = 50, message = "配置类型长度不能超过50个字符")
    private String configType;

    /**
     * 配置内容（JSON格式）
     */
    @NotBlank(message = "配置内容不能为空")
    private String configContent;

    /**
     * 配置名称
     */
    @NotBlank(message = "配置名称不能为空")
    @Size(max = 100, message = "配置名称长度不能超过100个字符")
    private String configName;

    /**
     * 是否默认配置
     */
    private Boolean isDefault = false;

    /**
     * 备注
     */
    @Size(max = 500, message = "备注长度不能超过500个字符")
    private String remark;
}
