package com.aiprompt2draw.mapper;

import com.aiprompt2draw.entity.UserConfig;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户配置Mapper
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Mapper
public interface UserConfigMapper extends BaseMapper<UserConfig> {

    /**
     * 根据API Key ID查询配置列表
     *
     * @param apiKeyId API Key ID
     * @return 配置列表
     */
    List<UserConfig> selectByApiKeyId(@Param("apiKeyId") Long apiKeyId);

    /**
     * 根据配置类型查询
     *
     * @param apiKeyId API Key ID
     * @param configType 配置类型
     * @return 配置
     */
    UserConfig selectByApiKeyIdAndType(@Param("apiKeyId") Long apiKeyId, @Param("configType") String configType);

    /**
     * 根据API Key ID删除配置
     *
     * @param apiKeyId API Key ID
     * @return 删除行数
     */
    int deleteByApiKeyId(@Param("apiKeyId") Long apiKeyId);

    /**
     * 根据API Key ID和配置类型删除
     *
     * @param apiKeyId API Key ID
     * @param configType 配置类型
     * @return 删除行数
     */
    int deleteByApiKeyIdAndType(@Param("apiKeyId") Long apiKeyId, @Param("configType") String configType);
}