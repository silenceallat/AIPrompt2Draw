package com.aiprompt2draw.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 登录请求DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@Schema(description = "管理员登录请求")
public class LoginRequest {

    @NotBlank(message = "用户名不能为空")
    @Schema(description = "用户名", required = true, example = "admin")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Schema(description = "密码", required = true, example = "admin123")
    private String password;
}
