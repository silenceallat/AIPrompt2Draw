package com.aiprompt2draw.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户API密钥关联实体类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@TableName("user_api_key")
public class UserApiKey {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * API密钥ID
     */
    private Long apiKeyId;

    /**
     * 分配状态: 0-未分配 1-已分配 2-已回收
     */
    private Integer status;

    /**
     * 分配时间
     */
    private LocalDateTime assignedTime;

    /**
     * 回收时间
     */
    private LocalDateTime revokedTime;

    /**
     * 分配管理员ID
     */
    private Long assignedBy;

    /**
     * 回收管理员ID
     */
    private Long revokedBy;

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