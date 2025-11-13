package com.aiprompt2draw.controller;

import com.aiprompt2draw.dto.LoginRequest;
import com.aiprompt2draw.entity.AdminUser;
import com.aiprompt2draw.service.AdminService;
import com.aiprompt2draw.utils.IpUtils;
import com.aiprompt2draw.vo.LoginResponse;
import com.aiprompt2draw.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

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
@Tag(name = "管理员API", description = "管理员登录和信息管理接口")
public class AdminController {

    private final AdminService adminService;

    /**
     * 管理员登录
     */
    @PostMapping("/login")
    @Operation(summary = "管理员登录", description = "使用用户名和密码登录,返回JWT Token")
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
}
