package com.aiprompt2draw.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户配置实体
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@TableName("user_config")
public class UserConfig {

    /**
     * 配置ID
     */
    @TableId(type = IdType.AUTO)
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
     * 逻辑删除: 0-未删除 1-已删除
     */
    @TableLogic
    private Integer deleted;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 备注
     */
    private String remark;
}