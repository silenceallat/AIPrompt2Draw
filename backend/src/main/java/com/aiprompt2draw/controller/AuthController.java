package com.aiprompt2draw.controller;

import com.aiprompt2draw.dto.LoginRequest;
import com.aiprompt2draw.entity.AdminUser;
import com.aiprompt2draw.service.AdminService;
import com.aiprompt2draw.utils.IpUtils;
import com.aiprompt2draw.vo.LoginResponse;
import com.aiprompt2draw.vo.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

/**
 * 统一认证API
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AdminService adminService;

    /**
     * 统一登录
     * 支持管理员和普通用户登录
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                      HttpServletRequest httpRequest) {

        String ipAddress = IpUtils.getIpAddress(httpRequest);

        try {
            // 尝试管理员登录
            String token = adminService.login(request.getUsername(), request.getPassword(), ipAddress);
            AdminUser admin = adminService.getByUsername(request.getUsername());

            // 构建响应 - 管理员用户
            LoginResponse response = new LoginResponse(
                    token,
                    admin.getUsername(),
                    admin.getNickname(),
                    "admin"  // 用户角色
            );

            log.info("管理员登录成功: username={}, ip={}", request.getUsername(), ipAddress);
            return Result.success(response);

        } catch (Exception e) {
            // 管理员登录失败，尝试普通用户登录
            // 普通用户使用固定的测试凭证（实际项目中应该有用户表）
            if ("user".equals(request.getUsername()) && "user123".equals(request.getPassword())) {
                // 生成普通用户token（简化处理）
                String token = "user_token_" + System.currentTimeMillis();

                // 构建响应 - 普通用户
                LoginResponse response = new LoginResponse(
                        token,
                        request.getUsername(),
                        "普通用户",
                        "user"  // 用户角色
                );

                log.info("普通用户登录成功: username={}, ip={}", request.getUsername(), ipAddress);
                return Result.success(response);
            } else {
                log.warn("登录失败: username={}, ip={}", request.getUsername(), ipAddress);
                return Result.error(401, "用户名或密码错误");
            }
        }
    }

    /**
     * 登出
     */
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("Authorization") String token) {
        // 简化处理，实际项目中应该将token加入黑名单
        log.info("用户登出");
        return Result.success();
    }

    /**
     * 验证token
     */
    @GetMapping("/verify")
    public Result<LoginResponse> verify(@RequestHeader("Authorization") String token) {
        // 简化处理，实际项目中应该验证token有效性
        if (token != null && (token.startsWith("user_token_") || token.length() > 50)) {
            // 根据token判断用户类型
            if (token.startsWith("user_token_")) {
                LoginResponse response = new LoginResponse(
                        token,
                        "user",
                        "普通用户",
                        "user"
                );
                return Result.success(response);
            } else {
                // 管理员token（JWT）
                LoginResponse response = new LoginResponse(
                        token,
                        "admin",
                        "系统管理员",
                        "admin"
                );
                return Result.success(response);
            }
        }
        return Result.error(401, "Token无效");
    }
}