package com.aiprompt2draw.vo;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应VO
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;

    private String username;

    private String nickname;

    private String role;  // 用户角色: admin-管理员, user-普通用户

    // 兼容旧的构造函数
    public LoginResponse(String token, String username, String nickname) {
        this.token = token;
        this.username = username;
        this.nickname = nickname;
        this.role = "admin";  // 默认为管理员
    }
}
