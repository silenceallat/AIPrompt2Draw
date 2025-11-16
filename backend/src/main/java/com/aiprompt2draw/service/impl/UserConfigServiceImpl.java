package com.aiprompt2draw.service.impl;

import com.aiprompt2draw.entity.UserConfig;
import com.aiprompt2draw.mapper.UserConfigMapper;
import com.aiprompt2draw.service.UserConfigService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户配置服务实现
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
public class UserConfigServiceImpl extends ServiceImpl<UserConfigMapper, UserConfig> implements UserConfigService {

    @Override
    public List<UserConfig> getConfigsByApiKeyId(Long apiKeyId) {
        log.debug("根据API Key ID查询配置列表: {}", apiKeyId);
        return baseMapper.selectByApiKeyId(apiKeyId);
    }

    @Override
    public UserConfig getConfigByApiKeyIdAndType(Long apiKeyId, String configType) {
        log.debug("根据API Key ID和配置类型查询配置: {}, {}", apiKeyId, configType);
        return baseMapper.selectByApiKeyIdAndType(apiKeyId, configType);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserConfig saveOrUpdateConfig(UserConfig userConfig) {
        log.info("保存或更新用户配置: {}", userConfig.getConfigName());

        // 设置时间
        LocalDateTime now = LocalDateTime.now();
        if (userConfig.getId() == null) {
            // 新建配置
            userConfig.setCreateTime(now);
            userConfig.setUpdateTime(now);
        } else {
            // 更新配置
            userConfig.setUpdateTime(now);
        }

        // 如果设置为默认配置，先取消其他默认配置
        if (Boolean.TRUE.equals(userConfig.getIsDefault())) {
            this.cancelDefaultConfigs(userConfig.getApiKeyId(), userConfig.getConfigType());
        }

        // 保存或更新
        this.saveOrUpdate(userConfig);

        log.info("用户配置保存成功: ID={}, 类型={}, 默认={}",
                userConfig.getId(), userConfig.getConfigType(), userConfig.getIsDefault());

        return userConfig;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean setAsDefault(Long configId, Long apiKeyId) {
        log.info("设置默认配置: configId={}, apiKeyId={}", configId, apiKeyId);

        // 查询配置
        UserConfig config = this.getById(configId);
        if (config == null || !config.getApiKeyId().equals(apiKeyId)) {
            log.warn("配置不存在或无权限: configId={}, apiKeyId={}", configId, apiKeyId);
            return false;
        }

        // 取消同类型的其他默认配置
        this.cancelDefaultConfigs(apiKeyId, config.getConfigType());

        // 设置为默认
        LambdaUpdateWrapper<UserConfig> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(UserConfig::getId, configId)
                    .set(UserConfig::getIsDefault, true)
                    .set(UserConfig::getUpdateTime, LocalDateTime.now());

        boolean result = this.update(updateWrapper);

        if (result) {
            log.info("默认配置设置成功: configId={}", configId);
        } else {
            log.error("默认配置设置失败: configId={}", configId);
        }

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteConfig(Long configId, Long apiKeyId) {
        log.info("删除用户配置: configId={}, apiKeyId={}", configId, apiKeyId);

        // 查询配置
        UserConfig config = this.getById(configId);
        if (config == null || !config.getApiKeyId().equals(apiKeyId)) {
            log.warn("配置不存在或无权限: configId={}, apiKeyId={}", configId, apiKeyId);
            return false;
        }

        // 删除配置
        boolean result = this.removeById(configId);

        if (result) {
            log.info("用户配置删除成功: configId={}", configId);
        } else {
            log.error("用户配置删除失败: configId={}", configId);
        }

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteConfigsByApiKeyId(Long apiKeyId) {
        log.info("根据API Key ID删除所有配置: apiKeyId={}", apiKeyId);

        int count = baseMapper.deleteByApiKeyId(apiKeyId);

        log.info("根据API Key ID删除配置完成: apiKeyId={}, 删除数量={}", apiKeyId, count);

        return count;
    }

    /**
     * 取消指定API Key和配置类型的默认配置
     *
     * @param apiKeyId API Key ID
     * @param configType 配置类型
     */
    private void cancelDefaultConfigs(Long apiKeyId, String configType) {
        if (!StringUtils.hasText(configType)) {
            return;
        }

        LambdaUpdateWrapper<UserConfig> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(UserConfig::getApiKeyId, apiKeyId)
                    .eq(UserConfig::getConfigType, configType)
                    .eq(UserConfig::getIsDefault, true)
                    .set(UserConfig::getIsDefault, false)
                    .set(UserConfig::getUpdateTime, LocalDateTime.now());

        this.update(updateWrapper);

        log.debug("取消默认配置: apiKeyId={}, configType={}", apiKeyId, configType);
    }
}