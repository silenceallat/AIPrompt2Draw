package com.aiprompt2draw.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * API Key实体类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@TableName("api_key")
public class ApiKey {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * API Key值
     */
    private String keyValue;

    /**
     * Key类型: 1-试用 2-付费 3-VIP
     */
    private Integer keyType;

    /**
     * 剩余额度(次数)
     */
    private Integer quota;

    /**
     * 总额度
     */
    private Integer totalQuota;

    /**
     * 状态: 0-禁用 1-启用 2-已过期
     */
    private Integer status;

    /**
     * 每分钟请求限制
     */
    private Integer rateLimit;

    /**
     * 过期时间
     */
    private LocalDateTime expireTime;

    /**
     * 备注信息
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
