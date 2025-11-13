package com.aiprompt2draw.exception;

import com.aiprompt2draw.vo.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e) {
        log.error("业务异常: {}", e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    /**
     * 参数校验异常
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public Result<?> handleValidationException(Exception e) {
        String message;
        if (e instanceof MethodArgumentNotValidException ex) {
            message = ex.getBindingResult().getFieldError() != null
                    ? ex.getBindingResult().getFieldError().getDefaultMessage()
                    : "参数校验失败";
        } else {
            BindException ex = (BindException) e;
            message = ex.getBindingResult().getFieldError() != null
                    ? ex.getBindingResult().getFieldError().getDefaultMessage()
                    : "参数校验失败";
        }
        log.error("参数校验异常: {}", message);
        return Result.error(400, message);
    }

    /**
     * 系统异常
     */
    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error("系统异常,请稍后重试");
    }
}
