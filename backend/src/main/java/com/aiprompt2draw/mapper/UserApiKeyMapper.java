package com.aiprompt2draw.mapper;

import com.aiprompt2draw.entity.UserApiKey;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户API密钥关联数据访问层
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Mapper
public interface UserApiKeyMapper extends BaseMapper<UserApiKey> {
}