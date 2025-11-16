package com.aiprompt2draw.service;

import com.aiprompt2draw.entity.UserConfig;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * 用户配置服务接口
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
public interface UserConfigService extends IService<UserConfig> {

    /**
     * 根据API Key ID查询配置列表
     *
     * @param apiKeyId API Key ID
     * @return 配置列表
     */
    List<UserConfig> getConfigsByApiKeyId(Long apiKeyId);

    /**
     * 根据API Key ID和配置类型查询配置
     *
     * @param apiKeyId API Key ID
     * @param configType 配置类型
     * @return 配置
     */
    UserConfig getConfigByApiKeyIdAndType(Long apiKeyId, String configType);

    /**
     * 保存或更新用户配置
     *
     * @param userConfig 用户配置
     * @return 保存后的配置
     */
    UserConfig saveOrUpdateConfig(UserConfig userConfig);

    /**
     * 设置为默认配置
     *
     * @param configId 配置ID
     * @param apiKeyId API Key ID
     * @return 是否成功
     */
    boolean setAsDefault(Long configId, Long apiKeyId);

    /**
     * 删除用户配置
     *
     * @param configId 配置ID
     * @param apiKeyId API Key ID
     * @return 是否成功
     */
    boolean deleteConfig(Long configId, Long apiKeyId);

    /**
     * 根据API Key ID删除所有配置
     *
     * @param apiKeyId API Key ID
     * @return 删除数量
     */
    int deleteConfigsByApiKeyId(Long apiKeyId);
}