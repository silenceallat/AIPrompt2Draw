package com.aiprompt2draw.controller;

import com.aiprompt2draw.entity.User;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.service.UserService;
import com.aiprompt2draw.service.ApiKeyService;
import com.aiprompt2draw.utils.IpUtils;
import com.aiprompt2draw.utils.JwtUtils;
import com.aiprompt2draw.vo.Result;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import cn.hutool.crypto.digest.BCrypt;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户管理控制器
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ApiKeyService apiKeyService;
    private final JwtUtils jwtUtils;

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public Result<String> register(@Valid @RequestBody User user) {
        try {
            boolean success = userService.register(user);
            if (success) {
                return Result.success("注册成功");
            } else {
                return Result.error("注册失败");
            }
        } catch (Exception e) {
            log.error("用户注册失败", e);
            return Result.error("注册失败：" + e.getMessage());
        }
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest,
                                               HttpServletRequest request) {
        try {
            String username = loginRequest.get("username");
            String password = loginRequest.get("password");

            if (username == null || password == null) {
                return Result.error("用户名和密码不能为空");
            }

            User user = userService.login(username, password);
            if (user == null) {
                return Result.error("用户名或密码错误");
            }

            // 更新最后登录信息
            String clientIp = IpUtils.getIpAddress(request);
            userService.updateLastLoginInfo(user.getId(), clientIp);

            // 生成JWT Token
            String token = jwtUtils.generateToken(user.getUsername());

            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            result.put("user", User.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .nickname(user.getNickname())
                    .email(user.getEmail())
                    .avatar(user.getAvatar())
                    .status(user.getStatus())
                    .lastLoginTime(user.getLastLoginTime())
                    .build());

            return Result.success(result);
        } catch (Exception e) {
            log.error("用户登录失败", e);
            return Result.error("登录失败：" + e.getMessage());
        }
    }

    /**
     * 获取用户信息
     */
    @GetMapping("/info")
    public Result<User> getUserInfo(@RequestHeader("Authorization") String authorization) {
        try {
            // 从token中获取用户名
            String token = authorization.replace("Bearer ", "");
            String username = jwtUtils.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 隐藏敏感信息
            user.setPassword(null);

            return Result.success(user);
        } catch (Exception e) {
            log.error("获取用户信息失败", e);
            return Result.error("获取用户信息失败：" + e.getMessage());
        }
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/info")
    public Result<String> updateUserInfo(@RequestHeader("Authorization") String authorization,
                                          @RequestBody User userUpdate) {
        try {
            String token = authorization.replace("Bearer ", "");
            String username = jwtUtils.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 只允许更新特定字段
            if (userUpdate.getNickname() != null) {
                user.setNickname(userUpdate.getNickname());
            }
            if (userUpdate.getEmail() != null) {
                // 检查邮箱是否已被其他用户使用
                if (!user.getEmail().equals(userUpdate.getEmail()) && userService.existsByEmail(userUpdate.getEmail())) {
                    return Result.error("邮箱已被使用");
                }
                user.setEmail(userUpdate.getEmail());
            }
            if (userUpdate.getPhone() != null) {
                user.setPhone(userUpdate.getPhone());
            }
            if (userUpdate.getAvatar() != null) {
                user.setAvatar(userUpdate.getAvatar());
            }

            boolean success = userService.updateById(user);
            if (success) {
                return Result.success("更新用户信息成功");
            } else {
                return Result.error("更新用户信息失败");
            }
        } catch (Exception e) {
            log.error("更新用户信息失败", e);
            return Result.error("更新用户信息失败：" + e.getMessage());
        }
    }

    /**
     * 修改密码
     */
    @PutMapping("/password")
    public Result<String> updatePassword(@RequestHeader("Authorization") String authorization,
                                          @RequestBody Map<String, String> passwordRequest) {
        try {
            String token = authorization.replace("Bearer ", "");
            String username = jwtUtils.getUsernameFromToken(token);

            String oldPassword = passwordRequest.get("oldPassword");
            String newPassword = passwordRequest.get("newPassword");

            if (oldPassword == null || newPassword == null) {
                return Result.error("旧密码和新密码不能为空");
            }

            User user = userService.findByUsername(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 验证旧密码
            if (!BCrypt.checkpw(oldPassword, user.getPassword())) {
                return Result.error("旧密码错误");
            }

            // 更新密码
            user.setPassword(BCrypt.hashpw(newPassword));
            boolean success = userService.updateById(user);

            if (success) {
                return Result.success("密码修改成功");
            } else {
                return Result.error("密码修改失败");
            }
        } catch (Exception e) {
            log.error("修改密码失败", e);
            return Result.error("修改密码失败：" + e.getMessage());
        }
    }

    /**
     * 获取用户列表（管理员）
     */
    @GetMapping("/list")
    public Result<Page<User>> getUserList(@RequestParam(defaultValue = "1") Integer current,
                                           @RequestParam(defaultValue = "10") Integer size,
                                           @RequestParam(required = false) String username,
                                           @RequestParam(required = false) Integer status) {
        try {
            Page<User> page = new Page<>(current, size);
            Page<User> result = userService.getUserList(page, username, status);

            // 隐藏密码信息
            result.getRecords().forEach(user -> user.setPassword(null));

            return Result.success(result);
        } catch (Exception e) {
            log.error("获取用户列表失败", e);
            return Result.error("获取用户列表失败：" + e.getMessage());
        }
    }

    /**
     * 启用/禁用用户（管理员）
     */
    @PutMapping("/{userId}/status")
    public Result<String> updateUserStatus(@PathVariable Long userId,
                                             @RequestBody Map<String, Integer> statusRequest) {
        try {
            Integer status = statusRequest.get("status");
            if (status == null || (status != 0 && status != 1)) {
                return Result.error("状态值无效");
            }

            boolean success = userService.updateUserStatus(userId, status);
            if (success) {
                String message = status == 1 ? "用户启用成功" : "用户禁用成功";
                return Result.success(message);
            } else {
                return Result.error("操作失败");
            }
        } catch (Exception e) {
            log.error("更新用户状态失败", e);
            return Result.error("操作失败：" + e.getMessage());
        }
    }

    // =================== 用户密钥管理功能 ===================

    /**
     * 获取我的API密钥列表
     */
    @GetMapping("/keys")
    public Result<List<Map<String, Object>>> getMyApiKeys(@RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            String username = jwtUtils.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            List<Map<String, Object>> userApiKeys = apiKeyService.getUserApiKeys(user.getId());
            return Result.success("获取我的API密钥列表成功", userApiKeys);
        } catch (Exception e) {
            log.error("获取我的API密钥列表失败", e);
            return Result.error("获取我的API密钥列表失败：" + e.getMessage());
        }
    }

    /**
     * 获取API密钥详情（仅限已分配给我的密钥）
     */
    @GetMapping("/keys/{apiKeyId}")
    public Result<Map<String, Object>> getApiKeyDetail(@RequestHeader("Authorization") String authorization,
                                                     @PathVariable Long apiKeyId) {
        try {
            String token = authorization.replace("Bearer ", "");
            String username = jwtUtils.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 首先验证该密钥是否已分配给当前用户
            List<Map<String, Object>> userApiKeys = apiKeyService.getUserApiKeys(user.getId());
            boolean hasAccess = userApiKeys.stream()
                    .anyMatch(keyInfo -> keyInfo.get("apiKeyId").equals(apiKeyId));

            if (!hasAccess) {
                return Result.error("无权访问此API密钥");
            }

            Map<String, Object> detail = apiKeyService.getApiKeyDetailWithPermissions(apiKeyId);
            if (detail == null) {
                return Result.error("API密钥不存在");
            }

            return Result.success("获取API密钥详情成功", detail);
        } catch (Exception e) {
            log.error("获取API密钥详情失败", e);
            return Result.error("获取API密钥详情失败：" + e.getMessage());
        }
    }

    /**
     * 查询API密钥额度
     */
    @GetMapping("/keys/{apiKeyId}/quota")
    public Result<Map<String, Object>> getApiKeyQuota(@RequestHeader("Authorization") String authorization,
                                                     @PathVariable Long apiKeyId) {
        try {
            String token = authorization.replace("Bearer ", "");
            String username = jwtUtils.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 首先验证该密钥是否已分配给当前用户
            List<Map<String, Object>> userApiKeys = apiKeyService.getUserApiKeys(user.getId());
            boolean hasAccess = userApiKeys.stream()
                    .anyMatch(keyInfo -> keyInfo.get("apiKeyId").equals(apiKeyId));

            if (!hasAccess) {
                return Result.error("无权访问此API密钥");
            }

            // 获取密钥详情
            Map<String, Object> detail = apiKeyService.getApiKeyDetailWithPermissions(apiKeyId);
            if (detail == null) {
                return Result.error("API密钥不存在");
            }

            ApiKey apiKey = (ApiKey) detail.get("apiKey");

            Map<String, Object> quotaInfo = new HashMap<>();
            quotaInfo.put("apiKeyId", apiKeyId);
            quotaInfo.put("currentQuota", apiKey.getQuota());
            quotaInfo.put("totalQuota", apiKey.getTotalQuota());
            quotaInfo.put("usedQuota", apiKey.getTotalQuota() - apiKey.getQuota());
            quotaInfo.put("usagePercentage", apiKey.getTotalQuota() > 0 ?
                    (double)(apiKey.getTotalQuota() - apiKey.getQuota()) / apiKey.getTotalQuota() * 100 : 0);

            return Result.success("获取API密钥额度成功", quotaInfo);
        } catch (Exception e) {
            log.error("获取API密钥额度失败", e);
            return Result.error("获取API密钥额度失败：" + e.getMessage());
        }
    }

    /**
     * 验证API密钥是否可用
     */
    @PostMapping("/keys/{apiKeyId}/validate")
    public Result<Map<String, Object>> validateApiKey(@RequestHeader("Authorization") String authorization,
                                                     @PathVariable Long apiKeyId) {
        try {
            String token = authorization.replace("Bearer ", "");
            String username = jwtUtils.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 首先验证该密钥是否已分配给当前用户
            List<Map<String, Object>> userApiKeys = apiKeyService.getUserApiKeys(user.getId());
            boolean hasAccess = userApiKeys.stream()
                    .anyMatch(keyInfo -> keyInfo.get("apiKeyId").equals(apiKeyId));

            if (!hasAccess) {
                return Result.error("无权访问此API密钥");
            }

            // 获取密钥详情
            Map<String, Object> detail = apiKeyService.getApiKeyDetailWithPermissions(apiKeyId);
            if (detail == null) {
                return Result.error("API密钥不存在");
            }

            ApiKey apiKey = (ApiKey) detail.get("apiKey");

            Map<String, Object> validationResult = new HashMap<>();
            validationResult.put("apiKeyId", apiKeyId);
            validationResult.put("isValid", apiKey.getQuota() > 0 && "1".equals(apiKey.getStatus()));
            validationResult.put("status", apiKey.getStatus());
            validationResult.put("quota", apiKey.getQuota());
            validationResult.put("hasPermission", !detail.get("permissions").toString().equals("[]"));

            return Result.success("API密钥验证成功", validationResult);
        } catch (Exception e) {
            log.error("验证API密钥失败", e);
            return Result.error("验证API密钥失败：" + e.getMessage());
        }
    }

    /**
     * 获取用户可用的模型列表
     */
    @GetMapping("/models")
    public Result<List<Map<String, Object>>> getAvailableModels(@RequestHeader("Authorization") String authorization,
                                                              @RequestParam(required = false) Long apiKeyId) {
        try {
            String token = authorization.replace("Bearer ", "");
            String username = jwtUtils.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 如果指定了apiKeyId，验证访问权限
            if (apiKeyId != null) {
                List<Map<String, Object>> userApiKeys = apiKeyService.getUserApiKeys(user.getId());
                boolean hasAccess = userApiKeys.stream()
                        .anyMatch(keyInfo -> keyInfo.get("apiKeyId").equals(apiKeyId));

                if (!hasAccess) {
                    return Result.error("无权访问此API密钥");
                }
            }

            // 这里应该查询模型配置表获取可用模型
            // 暂时返回空列表，实际实现需要结合模型配置和用户权限
            List<Map<String, Object>> models = new ArrayList<>();

            return Result.success("获取可用模型列表成功", models);
        } catch (Exception e) {
            log.error("获取可用模型列表失败", e);
            return Result.error("获取可用模型列表失败：" + e.getMessage());
        }
    }
}
