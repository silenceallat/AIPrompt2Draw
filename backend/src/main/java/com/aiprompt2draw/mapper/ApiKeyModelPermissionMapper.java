package com.aiprompt2draw.mapper;

import com.aiprompt2draw.entity.ApiKeyModelPermission;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * API密钥模型权限关联数据访问层
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Mapper
public interface ApiKeyModelPermissionMapper extends BaseMapper<ApiKeyModelPermission> {
}