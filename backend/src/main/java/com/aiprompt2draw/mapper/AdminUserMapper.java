package com.aiprompt2draw.mapper;

import com.aiprompt2draw.entity.AdminUser;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 管理员用户Mapper接口
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Mapper
public interface AdminUserMapper extends BaseMapper<AdminUser> {
}
