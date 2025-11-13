package com.aiprompt2draw.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 使用记录实体类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@TableName("usage_record")
public class UsageRecord {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * API Key ID
     */
    private Long apiKeyId;

    /**
     * API Key值
     */
    private String keyValue;

    /**
     * 使用的模型: openai/claude/wenxin等
     */
    private String modelType;

    /**
     * 具体模型名称: gpt-4/claude-3-sonnet等
     */
    private String modelName;

    /**
     * 用户输入内容
     */
    private String inputText;

    /**
     * 生成的XML内容
     */
    private String outputXml;

    /**
     * 输入Token数
     */
    private Integer promptTokens;

    /**
     * 输出Token数
     */
    private Integer completionTokens;

    /**
     * 总Token数
     */
    private Integer totalTokens;

    /**
     * 本次调用成本(元)
     */
    private BigDecimal cost;

    /**
     * 响应时间(毫秒)
     */
    private Integer responseTime;

    /**
     * 状态: 1-成功 0-失败
     */
    private Integer status;

    /**
     * 错误信息
     */
    private String errorMsg;

    /**
     * 请求IP
     */
    private String ipAddress;

    /**
     * 用户代理
     */
    private String userAgent;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}
