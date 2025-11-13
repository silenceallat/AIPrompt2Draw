package com.aiprompt2draw.exception;

import lombok.Getter;

/**
 * 业务异常
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Getter
public class BusinessException extends RuntimeException {

    private final Integer code;

    public BusinessException(String message) {
        super(message);
        this.code = 500;
    }

    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
        this.code = 500;
    }
}
