package com.aiprompt2draw.controller;

import com.aiprompt2draw.dto.LoginRequest;
import com.aiprompt2draw.dto.ResetPasswordRequest;
import com.aiprompt2draw.entity.AdminUser;
import com.aiprompt2draw.service.AdminService;
import com.aiprompt2draw.utils.IpUtils;
import com.aiprompt2draw.vo.LoginResponse;
import com.aiprompt2draw.vo.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

/**
 * 管理员API
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /**
     * 管理员登录
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                        HttpServletRequest httpRequest) {

        String ipAddress = IpUtils.getIpAddress(httpRequest);

        // 登录
        String token = adminService.login(request.getUsername(), request.getPassword(), ipAddress);

        // 查询管理员信息
        AdminUser admin = adminService.getByUsername(request.getUsername());

        // 构建响应
        LoginResponse response = new LoginResponse(
                token,
                admin.getUsername(),
                admin.getNickname()
        );

        return Result.success(response);
    }

    /**
     * 重置密码
     */
    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        adminService.resetPassword(request.getUsername(), request.getOldPassword(), request.getNewPassword());
        return Result.success();
    }
}
