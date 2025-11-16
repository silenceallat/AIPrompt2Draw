package com.aiprompt2draw.dto;


import javax.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 登录请求DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
public class LoginRequest {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;
}
