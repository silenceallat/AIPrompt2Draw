package com.aiprompt2draw.enums;

import lombok.Getter;

/**
 * API Key类型枚举
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Getter
public enum ApiKeyType {

    /**
     * 试用
     */
    TRIAL(1, "试用", "t"),

    /**
     * 付费
     */
    PAID(2, "付费", "p"),

    /**
     * VIP
     */
    VIP(3, "VIP", "v");

    private final Integer code;
    private final String desc;
    private final String prefix;

    ApiKeyType(Integer code, String desc, String prefix) {
        this.code = code;
        this.desc = desc;
        this.prefix = prefix;
    }

    public static ApiKeyType getByCode(Integer code) {
        for (ApiKeyType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        return TRIAL;
    }
}
