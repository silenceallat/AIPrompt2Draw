package com.aiprompt2draw.service;

import com.aiprompt2draw.entity.User;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 用户服务接口
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
public interface UserService extends IService<User> {

    /**
     * 根据用户名查询用户
     *
     * @param username 用户名
     * @return 用户信息
     */
    User findByUsername(String username);

    /**
     * 用户注册
     *
     * @param user 用户信息
     * @return 是否成功
     */
    boolean register(User user);

    /**
     * 用户登录
     *
     * @param username 用户名
     * @param password 密码
     * @return 用户信息
     */
    User login(String username, String password);

    /**
     * 更新最后登录信息
     *
     * @param userId 用户ID
     * @param loginIp 登录IP
     * @return 是否成功
     */
    boolean updateLastLoginInfo(Long userId, String loginIp);

    /**
     * 分页查询用户列表（管理员）
     *
     * @param page 分页对象
     * @param username 用户名（可选）
     * @param status 状态（可选）
     * @return 用户列表
     */
    Page<User> getUserList(Page<User> page, String username, Integer status);

    /**
     * 启用/禁用用户
     *
     * @param userId 用户ID
     * @param status 状态
     * @return 是否成功
     */
    boolean updateUserStatus(Long userId, Integer status);

    /**
     * 检查用户名是否存在
     *
     * @param username 用户名
     * @return 是否存在
     */
    boolean existsByUsername(String username);

    /**
     * 检查邮箱是否存在
     *
     * @param email 邮箱
     * @return 是否存在
     */
    boolean existsByEmail(String email);

    /**
     * 根据ID列表查询用户列表
     *
     * @param userIds 用户ID列表
     * @return 用户列表
     */
    List<User> listByIds(List<Long> userIds);
}