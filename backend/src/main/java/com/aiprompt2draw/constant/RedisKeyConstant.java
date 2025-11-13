package com.aiprompt2draw.constant;

/**
 * Redis Key常量
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
public interface RedisKeyConstant {

    /**
     * 限流Key前缀: rate_limit:{api_key}
     */
    String RATE_LIMIT_PREFIX = "rate_limit:";

    /**
     * 额度缓存Key前缀: quota:{api_key}
     */
    String QUOTA_PREFIX = "quota:";

    /**
     * 模型配置缓存Key前缀: model_config:{model_type}
     */
    String MODEL_CONFIG_PREFIX = "model_config:";

    /**
     * API Key验证缓存前缀: api_key_valid:{key_value}
     */
    String API_KEY_VALID_PREFIX = "api_key_valid:";

    /**
     * IP限流Key前缀: ip_rate_limit:{ip}
     */
    String IP_RATE_LIMIT_PREFIX = "ip_rate_limit:";

    /**
     * IP每日生成Key数量: ip_daily_keys:{ip}:{date}
     */
    String IP_DAILY_KEYS_PREFIX = "ip_daily_keys:";
}
