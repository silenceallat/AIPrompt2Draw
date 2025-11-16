package com.aiprompt2draw.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 重置密码请求DTO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
public class ResetPasswordRequest {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "原密码不能为空")
    private String oldPassword;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 20, message = "新密码长度必须在6-20位之间")
    private String newPassword;
}