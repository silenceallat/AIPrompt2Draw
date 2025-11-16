package com.aiprompt2draw.service;

import cn.hutool.core.util.StrUtil;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.entity.ApiKeyModelPermission;
import com.aiprompt2draw.entity.UserApiKey;
import com.aiprompt2draw.enums.ApiKeyStatus;
import com.aiprompt2draw.exception.BusinessException;
import com.aiprompt2draw.mapper.ApiKeyMapper;
import com.aiprompt2draw.mapper.ApiKeyModelPermissionMapper;
import com.aiprompt2draw.mapper.UserApiKeyMapper;
import com.aiprompt2draw.utils.ApiKeyGenerator;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * API Key服务
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyMapper apiKeyMapper;
    private final UserApiKeyMapper userApiKeyMapper;
    private final ApiKeyModelPermissionMapper apiKeyModelPermissionMapper;

    /**
     * 创建API Key
     *
     * @param keyType    Key类型
     * @param quota      额度
     * @param rateLimit  限流次数
     * @param expireDays 过期天数
     * @param remark     备注
     * @return API Key实体
     */
    public ApiKey createApiKey(Integer keyType, Integer quota, Integer rateLimit,
                                Integer expireDays, String remark) {
        // 生成API Key
        String keyValue = ApiKeyGenerator.generate(keyType);

        // 计算过期时间
        LocalDateTime expireTime = expireDays != null && expireDays > 0
                ? LocalDateTime.now().plusDays(expireDays)
                : null;

        // 创建实体
        ApiKey apiKey = new ApiKey();
        apiKey.setKeyValue(keyValue);
        apiKey.setKeyType(keyType);
        apiKey.setQuota(quota);
        apiKey.setTotalQuota(quota);
        apiKey.setStatus(ApiKeyStatus.ENABLED.getCode());
        apiKey.setRateLimit(rateLimit);
        apiKey.setExpireTime(expireTime);
        apiKey.setRemark(remark);

        // 保存到数据库
        apiKeyMapper.insert(apiKey);

        log.info("创建API Key成功: {}, 类型: {}, 额度: {}", keyValue, keyType, quota);

        return apiKey;
    }

    /**
     * 验证API Key
     *
     * @param keyValue API Key值
     * @return API Key实体
     */
    public ApiKey validateApiKey(String keyValue) {
        if (StrUtil.isBlank(keyValue)) {
            throw new BusinessException(401, "API Key不能为空");
        }

        // 验证格式
        if (!ApiKeyGenerator.isValidFormat(keyValue)) {
            throw new BusinessException(401, "API Key格式不正确");
        }

        // 从数据库查询
        ApiKey apiKey = getApiKeyByValue(keyValue);

        if (apiKey == null) {
            throw new BusinessException(401, "无效的API Key");
        }

        // 验证状态
        if (!ApiKeyStatus.ENABLED.getCode().equals(apiKey.getStatus())) {
            throw new BusinessException(403, "API Key已被禁用或已过期");
        }

        // 验证是否过期
        if (apiKey.getExpireTime() != null && LocalDateTime.now().isAfter(apiKey.getExpireTime())) {
            // 更新状态为已过期
            apiKey.setStatus(ApiKeyStatus.EXPIRED.getCode());
            apiKeyMapper.updateById(apiKey);

            throw new BusinessException(403, "API Key已过期");
        }

        // 验证额度
        if (apiKey.getQuota() <= 0) {
            throw new BusinessException(403, "额度不足,请联系管理员");
        }

        return apiKey;
    }

    /**
     * 根据Key值查询
     *
     * @param keyValue Key值
     * @return API Key实体
     */
    public ApiKey getApiKeyByValue(String keyValue) {
        LambdaQueryWrapper<ApiKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApiKey::getKeyValue, keyValue);
        return apiKeyMapper.selectOne(wrapper);
    }

    /**
     * 检查并扣减额度
     *
     * @param keyValue API Key值
     * @return 是否成功
     */
    public boolean checkAndDeductQuota(String keyValue) {
        // 直接从数据库查询和操作
        ApiKey apiKey = getApiKeyByValue(keyValue);
        if (apiKey == null || apiKey.getQuota() <= 0) {
            return false;
        }

        // 扣减额度
        int result = apiKeyMapper.deductQuota(keyValue, 1);
        return result > 0;
    }

    /**
     * 异步扣减额度(MySQL)
     *
     * @param keyValue API Key值
     */
    @Async
    public void asyncDeductQuota(String keyValue) {
        CompletableFuture.runAsync(() -> {
            try {
                apiKeyMapper.deductQuota(keyValue, 1);
            } catch (Exception e) {
                log.error("异步扣减额度失败: {}", keyValue, e);
            }
        });
    }

    /**
     * 获取剩余额度
     *
     * @param keyValue API Key值
     * @return 剩余额度
     */
    public Integer getQuota(String keyValue) {
        ApiKey apiKey = getApiKeyByValue(keyValue);
        return apiKey != null ? apiKey.getQuota() : 0;
    }

    /**
     * 清除API Key缓存
     *
     * @param keyValue API Key值
     */
    public void clearCache(String keyValue) {
        // 这里可以实现缓存清理逻辑
        // 如果使用Redis或其他缓存，可以在这里清理
        log.info("清除API Key缓存: {}", keyValue);
    }

    // =================== 管理员密钥管理功能 ===================

    /**
     * 管理员创建API Key
     *
     * @param keyType    Key类型
     * @param quota      额度
     * @param rateLimit  限流次数
     * @param expireDays 过期天数
     * @param remark     备注
     * @return API Key实体
     */
    @Transactional(rollbackFor = Exception.class)
    public ApiKey createApiKeyForAdmin(Integer keyType, Integer quota, Integer rateLimit,
                                        Integer expireDays, String remark) {
        // 生成API Key
        String keyValue = ApiKeyGenerator.generate(keyType);

        // 计算过期时间
        LocalDateTime expireTime = expireDays != null && expireDays > 0
                ? LocalDateTime.now().plusDays(expireDays)
                : null;

        // 创建实体
        ApiKey apiKey = new ApiKey();
        apiKey.setKeyValue(keyValue);
        apiKey.setKeyType(keyType);
        apiKey.setQuota(quota);
        apiKey.setTotalQuota(quota);
        apiKey.setStatus(ApiKeyStatus.ENABLED.getCode());
        apiKey.setRateLimit(rateLimit);
        apiKey.setExpireTime(expireTime);
        apiKey.setRemark(remark);
        apiKey.setCreateTime(LocalDateTime.now());
        apiKey.setUpdateTime(LocalDateTime.now());

        // 保存到数据库
        apiKeyMapper.insert(apiKey);

        log.info("管理员创建API Key成功: {}, 类型: {}, 额度: {}", keyValue, keyType, quota);

        return apiKey;
    }

    /**
     * 分页查询API密钥列表（管理员）
     *
     * @param page 分页对象
     * @param keyType 密钥类型（可选）
     * @param status 状态（可选）
     * @param startTime 开始时间（可选）
     * @param endTime 结束时间（可选）
     * @return API密钥列表
     */
    public Page<ApiKey> getApiKeyList(Page<ApiKey> page, Integer keyType, Integer status,
                                        LocalDateTime startTime, LocalDateTime endTime) {
        LambdaQueryWrapper<ApiKey> wrapper = new LambdaQueryWrapper<>();

        if (keyType != null) {
            wrapper.eq(ApiKey::getKeyType, keyType);
        }

        if (status != null) {
            wrapper.eq(ApiKey::getStatus, status);
        }

        if (startTime != null) {
            wrapper.ge(ApiKey::getCreateTime, startTime);
        }

        if (endTime != null) {
            wrapper.le(ApiKey::getCreateTime, endTime);
        }

        wrapper.orderByDesc(ApiKey::getCreateTime);

        return apiKeyMapper.selectPage(page, wrapper);
    }

    /**
     * 更新API Key状态
     *
     * @param apiKeyId API Key ID
     * @param status 状态
     * @return 是否成功
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean updateApiKeyStatus(Long apiKeyId, Integer status) {
        if (apiKeyId == null || status == null) {
            return false;
        }

        ApiKey apiKey = new ApiKey();
        apiKey.setId(apiKeyId);
        apiKey.setStatus(status);
        apiKey.setUpdateTime(LocalDateTime.now());

        boolean result = apiKeyMapper.updateById(apiKey) > 0;
        if (result) {
            log.info("更新API Key状态成功, apiKeyId: {}, status: {}", apiKeyId, status);
        } else {
            log.error("更新API Key状态失败, apiKeyId: {}", apiKeyId);
        }
        return result;
    }

    /**
     * 立即失效API Key
     *
     * @param apiKeyId API Key ID
     * @return 是否成功
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean invalidateApiKey(Long apiKeyId) {
        return updateApiKeyStatus(apiKeyId, ApiKeyStatus.DISABLED.getCode());
    }

    /**
     * 更新API Key
     *
     * @param apiKey API Key实体
     * @return 是否成功
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean updateApiKey(ApiKey apiKey) {
        if (apiKey == null || apiKey.getId() == null) {
            log.error("更新API Key失败，参数不完整");
            return false;
        }

        apiKey.setUpdateTime(LocalDateTime.now());
        boolean result = apiKeyMapper.updateById(apiKey) > 0;
        if (result) {
            log.info("更新API Key成功: {}", apiKey.getId());
        } else {
            log.error("更新API Key失败: {}", apiKey.getId());
        }
        return result;
    }

    /**
     * 删除API Key
     *
     * @param apiKeyId API Key ID
     * @return 是否成功
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteApiKey(Long apiKeyId) {
        if (apiKeyId == null) {
            return false;
        }

        // 先删除关联的权限配置
        LambdaQueryWrapper<ApiKeyModelPermission> permissionWrapper = new LambdaQueryWrapper<>();
        permissionWrapper.eq(ApiKeyModelPermission::getApiKeyId, apiKeyId);
        apiKeyModelPermissionMapper.delete(permissionWrapper);

        // 再删除用户分配关系
        LambdaQueryWrapper<UserApiKey> userKeyWrapper = new LambdaQueryWrapper<>();
        userKeyWrapper.eq(UserApiKey::getApiKeyId, apiKeyId);
        userApiKeyMapper.delete(userKeyWrapper);

        // 最后删除API Key
        boolean result = apiKeyMapper.deleteById(apiKeyId) > 0;
        if (result) {
            log.info("删除API Key成功: {}", apiKeyId);
        } else {
            log.error("删除API Key失败: {}", apiKeyId);
        }
        return result;
    }

    /**
     * 分配API Key给用户
     *
     * @param apiKeyId API Key ID
     * @param userId 用户ID
     * @param assignedBy 分配管理员ID
     * @param remark 备注
     * @return 是否成功
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean assignApiKeyToUser(Long apiKeyId, Long userId, Long assignedBy, String remark) {
        if (apiKeyId == null || userId == null) {
            return false;
        }

        // 检查API Key是否存在
        ApiKey apiKey = apiKeyMapper.selectById(apiKeyId);
        if (apiKey == null) {
            log.error("API Key不存在: {}", apiKeyId);
            return false;
        }

        // 检查是否已经分配给该用户
        LambdaQueryWrapper<UserApiKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserApiKey::getApiKeyId, apiKeyId);
        wrapper.eq(UserApiKey::getUserId, userId);
        wrapper.eq(UserApiKey::getStatus, 1); // 已分配状态
        UserApiKey existingAssignment = userApiKeyMapper.selectOne(wrapper);

        if (existingAssignment != null) {
            log.warn("API Key已经分配给该用户: apiKeyId: {}, userId: {}", apiKeyId, userId);
            return false;
        }

        // 创建分配关系
        UserApiKey userApiKey = new UserApiKey();
        userApiKey.setApiKeyId(apiKeyId);
        userApiKey.setUserId(userId);
        userApiKey.setStatus(1); // 已分配
        userApiKey.setAssignedTime(LocalDateTime.now());
        userApiKey.setAssignedBy(assignedBy);
        userApiKey.setRemark(remark);
        userApiKey.setCreateTime(LocalDateTime.now());
        userApiKey.setUpdateTime(LocalDateTime.now());

        boolean result = userApiKeyMapper.insert(userApiKey) > 0;
        if (result) {
            log.info("分配API Key给用户成功: apiKeyId: {}, userId: {}", apiKeyId, userId);
        } else {
            log.error("分配API Key给用户失败: apiKeyId: {}, userId: {}", apiKeyId, userId);
        }
        return result;
    }

    /**
     * 回收用户的API Key
     *
     * @param apiKeyId API Key ID
     * @param revokedBy 回收管理员ID
     * @return 是否成功
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean revokeApiKeyFromUser(Long apiKeyId, Long revokedBy) {
        if (apiKeyId == null) {
            return false;
        }

        LambdaQueryWrapper<UserApiKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserApiKey::getApiKeyId, apiKeyId);
        wrapper.eq(UserApiKey::getStatus, 1); // 只更新已分配的

        UserApiKey update = new UserApiKey();
        update.setStatus(2); // 已回收
        update.setRevokedTime(LocalDateTime.now());
        update.setRevokedBy(revokedBy);
        update.setUpdateTime(LocalDateTime.now());

        boolean result = userApiKeyMapper.update(update, wrapper) > 0;
        if (result) {
            log.info("回收用户API Key成功: apiKeyId: {}", apiKeyId);
        } else {
            log.error("回收用户API Key失败: apiKeyId: {}", apiKeyId);
        }
        return result;
    }

    /**
     * 配置API Key的模型权限
     *
     * @param apiKeyId API Key ID
     * @param modelIds 模型ID列表
     * @return 是否成功
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean configureApiKeyModelPermissions(Long apiKeyId, List<Long> modelIds) {
        if (apiKeyId == null || modelIds == null || modelIds.isEmpty()) {
            return false;
        }

        // 先删除现有权限配置
        LambdaQueryWrapper<ApiKeyModelPermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApiKeyModelPermission::getApiKeyId, apiKeyId);
        apiKeyModelPermissionMapper.delete(wrapper);

        // 批量添加新权限
        LocalDateTime now = LocalDateTime.now();
        for (Long modelId : modelIds) {
            ApiKeyModelPermission permission = new ApiKeyModelPermission();
            permission.setApiKeyId(apiKeyId);
            permission.setModelId(modelId);
            permission.setEnabled(1); // 启用
            permission.setCreateTime(now);
            permission.setUpdateTime(now);

            apiKeyModelPermissionMapper.insert(permission);
        }

        log.info("配置API Key模型权限成功: apiKeyId: {}, modelCount: {}", apiKeyId, modelIds.size());
        return true;
    }

    /**
     * 获取用户的API Key列表
     *
     * @param userId 用户ID
     * @return 用户API Key列表
     */
    public List<Map<String, Object>> getUserApiKeys(Long userId) {
        // 这里需要关联查询，返回用户有权访问的API Key信息
        // 由于当前框架限制，返回简单的列表
        LambdaQueryWrapper<UserApiKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserApiKey::getUserId, userId);
        wrapper.eq(UserApiKey::getStatus, 1); // 只返回已分配的
        wrapper.orderByDesc(UserApiKey::getAssignedTime);

        List<UserApiKey> userApiKeys = userApiKeyMapper.selectList(wrapper);
        return userApiKeys.stream().map(userKey -> {
            Map<String, Object> map = Map.of(
                "apiKeyId", userKey.getApiKeyId(),
                "assignedTime", userKey.getAssignedTime(),
                "status", userKey.getStatus(),
                "remark", userKey.getRemark()
            );
            return map;
        }).toList();
    }

    /**
     * 获取API Key详情（包含模型权限）
     *
     * @param apiKeyId API Key ID
     * @return API Key详情
     */
    public Map<String, Object> getApiKeyDetailWithPermissions(Long apiKeyId) {
        ApiKey apiKey = apiKeyMapper.selectById(apiKeyId);
        if (apiKey == null) {
            return null;
        }

        // 查询模型权限
        LambdaQueryWrapper<ApiKeyModelPermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApiKeyModelPermission::getApiKeyId, apiKeyId);
        wrapper.eq(ApiKeyModelPermission::getEnabled, 1);
        List<ApiKeyModelPermission> permissions = apiKeyModelPermissionMapper.selectList(wrapper);

        // 查询用户分配信息
        LambdaQueryWrapper<UserApiKey> userWrapper = new LambdaQueryWrapper<>();
        userWrapper.eq(UserApiKey::getApiKeyId, apiKeyId);
        userWrapper.eq(UserApiKey::getStatus, 1);
        List<UserApiKey> userAssignments = userApiKeyMapper.selectList(userWrapper);

        Map<String, Object> result = Map.of(
                "apiKey", apiKey,
                "permissions", permissions.stream().map(p -> Map.of(
                        "modelId", p.getModelId(),
                        "enabled", p.getEnabled()
                )).toList(),
                "userAssignments", userAssignments.stream().map(ua -> Map.of(
                        "userId", ua.getUserId(),
                        "assignedTime", ua.getAssignedTime(),
                        "assignedBy", ua.getAssignedBy(),
                        "remark", ua.getRemark()
                )).toList()
        );

        return result;
    }

    /**
     * 获取API Key统计信息
     *
     * @return 统计信息
     */
    public Map<String, Object> getApiKeyStats() {
        Map<String, Object> stats = new HashMap<>();

        // 总API Key数
        int totalKeys = Math.toIntExact(apiKeyMapper.selectCount(null));
        stats.put("totalKeys", totalKeys);

        // 按状态统计
        Map<String, Integer> statusStats = new HashMap<>();
        statusStats.put("enabled", 0);
        statusStats.put("disabled", 0);
        statusStats.put("expired", 0);

        LambdaQueryWrapper<ApiKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.select(ApiKey::getStatus);
        List<ApiKey> allKeys = apiKeyMapper.selectList(wrapper);

        for (ApiKey key : allKeys) {
            if (ApiKeyStatus.ENABLED.getCode().equals(key.getStatus())) {
                statusStats.put("enabled", statusStats.get("enabled") + 1);
            } else if (ApiKeyStatus.DISABLED.getCode().equals(key.getStatus())) {
                statusStats.put("disabled", statusStats.get("disabled") + 1);
            } else if (ApiKeyStatus.EXPIRED.getCode().equals(key.getStatus())) {
                statusStats.put("expired", statusStats.get("expired") + 1);
            }
        }

        stats.put("statusStats", statusStats);

        // 按类型统计
        Map<String, Integer> typeStats = new HashMap<>();
        typeStats.put("1", 0); // 试用
        typeStats.put("2", 0); // 付费
        typeStats.put("3", 0); // VIP

        for (ApiKey key : allKeys) {
            String type = key.getKeyType().toString();
            typeStats.put(type, typeStats.getOrDefault(type, 0) + 1);
        }

        stats.put("typeStats", typeStats);

        return stats;
    }
}
