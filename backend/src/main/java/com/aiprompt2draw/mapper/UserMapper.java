package com.aiprompt2draw.mapper;

import com.aiprompt2draw.entity.User;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户数据访问层
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}