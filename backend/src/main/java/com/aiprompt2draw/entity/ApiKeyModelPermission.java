package com.aiprompt2draw.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * API密钥模型权限关联实体类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@TableName("api_key_model_permission")
public class ApiKeyModelPermission {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * API密钥ID
     */
    private Long apiKeyId;

    /**
     * AI模型ID
     */
    private Long modelId;

    /**
     * 是否启用: 0-禁用 1-启用
     */
    private Integer enabled;

    /**
     * 备注
     */
    private String remark;

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
}