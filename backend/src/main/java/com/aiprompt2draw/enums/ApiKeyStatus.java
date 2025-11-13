package com.aiprompt2draw.enums;

import lombok.Getter;

/**
 * API Key状态枚举
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Getter
public enum ApiKeyStatus {

    /**
     * 禁用
     */
    DISABLED(0, "禁用"),

    /**
     * 启用
     */
    ENABLED(1, "启用"),

    /**
     * 已过期
     */
    EXPIRED(2, "已过期");

    private final Integer code;
    private final String desc;

    ApiKeyStatus(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
