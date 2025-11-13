package com.aiprompt2draw.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * AI模型配置实体类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@TableName("model_config")
public class ModelConfig {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 模型类型: openai/claude/wenxin等
     */
    private String modelType;

    /**
     * 模型名称
     */
    private String modelName;

    /**
     * 厂商API Key(加密存储)
     */
    private String apiKey;

    /**
     * API地址
     */
    private String apiUrl;

    /**
     * API Secret(部分厂商需要)
     */
    private String apiSecret;

    /**
     * 最大Token数
     */
    private Integer maxTokens;

    /**
     * 温度参数
     */
    private BigDecimal temperature;

    /**
     * 优先级(数字越大优先级越高)
     */
    private Integer priority;

    /**
     * 状态: 0-禁用 1-启用
     */
    private Integer status;

    /**
     * 每1K prompt tokens成本(元)
     */
    private BigDecimal costPer1kPromptTokens;

    /**
     * 每1K completion tokens成本(元)
     */
    private BigDecimal costPer1kCompletionTokens;

    /**
     * 备注
     */
    private String remark;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}
