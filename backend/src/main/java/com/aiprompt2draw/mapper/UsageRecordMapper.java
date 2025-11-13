package com.aiprompt2draw.mapper;

import com.aiprompt2draw.entity.UsageRecord;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 使用记录Mapper接口
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Mapper
public interface UsageRecordMapper extends BaseMapper<UsageRecord> {
}
