package com.aiprompt2draw.service.impl;

import cn.hutool.crypto.digest.BCrypt;
import com.aiprompt2draw.entity.User;
import com.aiprompt2draw.mapper.UserMapper;
import com.aiprompt2draw.service.UserService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户服务实现类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {


    @Override
    public User findByUsername(String username) {
        if (!StringUtils.hasText(username)) {
            return null;
        }
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        wrapper.eq(User::getStatus, 1); // 只查询启用的用户
        wrapper.last("LIMIT 1");
        return getOne(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean register(User user) {
        if (user == null || !StringUtils.hasText(user.getUsername()) || !StringUtils.hasText(user.getPassword())) {
            log.error("用户注册参数不完整");
            return false;
        }

        // 检查用户名是否已存在
        if (existsByUsername(user.getUsername())) {
            log.error("用户名已存在: {}", user.getUsername());
            return false;
        }

        // 检查邮箱是否已存在
        if (StringUtils.hasText(user.getEmail()) && existsByEmail(user.getEmail())) {
            log.error("邮箱已存在: {}", user.getEmail());
            return false;
        }

        // 密码加密
        user.setPassword(BCrypt.hashpw(user.getPassword()));

        // 设置默认值
        user.setStatus(1); // 默认启用
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());

        boolean result = save(user);
        if (result) {
            log.info("用户注册成功: {}", user.getUsername());
        } else {
            log.error("用户注册失败: {}", user.getUsername());
        }
        return result;
    }

    @Override
    public User login(String username, String password) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            return null;
        }

        User user = findByUsername(username);
        if (user == null) {
            log.warn("用户不存在: {}", username);
            return null;
        }

        // 验证密码
        if (!BCrypt.checkpw(password, user.getPassword())) {
            log.warn("密码错误: {}", username);
            return null;
        }

        return user;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateLastLoginInfo(Long userId, String loginIp) {
        if (userId == null) {
            return false;
        }

        User user = new User();
        user.setId(userId);
        user.setLastLoginTime(LocalDateTime.now());
        user.setLastLoginIp(loginIp);
        user.setUpdateTime(LocalDateTime.now());

        boolean result = updateById(user);
        if (result) {
            log.info("更新用户最后登录信息成功, userId: {}, loginIp: {}", userId, loginIp);
        } else {
            log.error("更新用户最后登录信息失败, userId: {}", userId);
        }
        return result;
    }

    @Override
    public Page<User> getUserList(Page<User> page, String username, Integer status) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(username)) {
            wrapper.like(User::getUsername, username);
        }

        if (status != null) {
            wrapper.eq(User::getStatus, status);
        }

        wrapper.orderByDesc(User::getCreateTime);

        return page(page, wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateUserStatus(Long userId, Integer status) {
        if (userId == null || status == null) {
            return false;
        }

        User user = new User();
        user.setId(userId);
        user.setStatus(status);
        user.setUpdateTime(LocalDateTime.now());

        boolean result = updateById(user);
        if (result) {
            log.info("更新用户状态成功, userId: {}, status: {}", userId, status);
        } else {
            log.error("更新用户状态失败, userId: {}", userId);
        }
        return result;
    }

    @Override
    public boolean existsByUsername(String username) {
        if (!StringUtils.hasText(username)) {
            return false;
        }
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        return count(wrapper) > 0;
    }

    @Override
    public boolean existsByEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, email);
        return count(wrapper) > 0;
    }

    @Override
    public List<User> listByIds(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return listByIds(userIds);
    }
}
