package com.aiprompt2draw.mapper;

import com.aiprompt2draw.entity.ApiKey;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

/**
 * API Key Mapper接口
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Mapper
public interface ApiKeyMapper extends BaseMapper<ApiKey> {

    /**
     * 扣减额度
     *
     * @param keyValue API Key值
     * @param amount   扣减数量
     * @return 影响行数
     */
    @Update("UPDATE api_key SET quota = quota - #{amount}, update_time = NOW() " +
            "WHERE key_value = #{keyValue} AND quota >= #{amount}")
    int deductQuota(@Param("keyValue") String keyValue, @Param("amount") int amount);
}
