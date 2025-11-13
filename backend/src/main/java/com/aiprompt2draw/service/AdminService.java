package com.aiprompt2draw.service;

import cn.hutool.crypto.digest.BCrypt;
import com.aiprompt2draw.entity.AdminUser;
import com.aiprompt2draw.exception.BusinessException;
import com.aiprompt2draw.mapper.AdminUserMapper;
import com.aiprompt2draw.utils.JwtUtils;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 管理员服务
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminUserMapper adminUserMapper;
    private final JwtUtils jwtUtils;

    /**
     * 管理员登录
     *
     * @param username  用户名
     * @param password  密码
     * @param ipAddress IP地址
     * @return JWT Token
     */
    public String login(String username, String password, String ipAddress) {
        // 查询管理员
        LambdaQueryWrapper<AdminUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUser::getUsername, username);
        AdminUser admin = adminUserMapper.selectOne(wrapper);

        if (admin == null) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 验证状态
        if (admin.getStatus() != 1) {
            throw new BusinessException(403, "账号已被禁用");
        }

        // 验证密码
        if (!BCrypt.checkpw(password, admin.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 更新登录信息
        admin.setLastLoginTime(LocalDateTime.now());
        admin.setLastLoginIp(ipAddress);
        adminUserMapper.updateById(admin);

        // 生成Token
        String token = jwtUtils.generateToken(username);

        log.info("管理员登录成功: username={}, ip={}", username, ipAddress);

        return token;
    }

    /**
     * 根据用户名获取管理员
     *
     * @param username 用户名
     * @return 管理员实体
     */
    public AdminUser getByUsername(String username) {
        LambdaQueryWrapper<AdminUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUser::getUsername, username);
        return adminUserMapper.selectOne(wrapper);
    }
}
