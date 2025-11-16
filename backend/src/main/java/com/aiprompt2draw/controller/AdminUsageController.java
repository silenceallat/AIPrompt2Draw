package com.aiprompt2draw.controller;

import com.aiprompt2draw.entity.UsageRecord;
import com.aiprompt2draw.mapper.UsageRecordMapper;
import com.aiprompt2draw.vo.Result;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 后台使用统计管理
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/usage")
@RequiredArgsConstructor
public class AdminUsageController {

    private final UsageRecordMapper usageRecordMapper;

    /**
     * 获取使用记录列表
     */
    @GetMapping
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String modelType,
            @RequestParam(required = false) String keyValue) {

        Page<UsageRecord> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<UsageRecord> wrapper = new LambdaQueryWrapper<>();

        if (status != null) {
            wrapper.eq(UsageRecord::getStatus, status);
        }
        if (modelType != null && !modelType.trim().isEmpty()) {
            wrapper.like(UsageRecord::getModelType, modelType);
        }
        if (keyValue != null && !keyValue.trim().isEmpty()) {
            wrapper.like(UsageRecord::getKeyValue, keyValue);
        }

        wrapper.orderByDesc(UsageRecord::getCreateTime);

        IPage<UsageRecord> pageResult = usageRecordMapper.selectPage(pageParam, wrapper);

        Map<String, Object> result = new HashMap<>();
        result.put("total", pageResult.getTotal());
        result.put("list", pageResult.getRecords());

        return Result.success(result);
    }

    /**
     * 获取使用统计概览
     */
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        Map<String, Object> overview = new HashMap<>();

        // 总使用次数
        LambdaQueryWrapper<UsageRecord> totalWrapper = new LambdaQueryWrapper<>();
        totalWrapper.eq(UsageRecord::getStatus, 1);
        Long totalCount = usageRecordMapper.selectCount(totalWrapper);

        // 今日使用次数
        LambdaQueryWrapper<UsageRecord> todayWrapper = new LambdaQueryWrapper<>();
        todayWrapper.eq(UsageRecord::getStatus, 1)
                .apply("DATE(create_time) = CURDATE()");
        Long todayCount = usageRecordMapper.selectCount(todayWrapper);

        // 总Token消耗
        totalWrapper.clear();
        totalWrapper.select(UsageRecord::getTotalTokens)
                .eq(UsageRecord::getStatus, 1);
        List<UsageRecord> records = usageRecordMapper.selectList(totalWrapper);
        Integer totalTokens = records.stream()
                .mapToInt(record -> record.getTotalTokens() != null ? record.getTotalTokens() : 0)
                .sum();

        // 成功率
        LambdaQueryWrapper<UsageRecord> successWrapper = new LambdaQueryWrapper<>();
        successWrapper.eq(UsageRecord::getStatus, 1);
        Long successCount = usageRecordMapper.selectCount(successWrapper);

        LambdaQueryWrapper<UsageRecord> failWrapper = new LambdaQueryWrapper<>();
        failWrapper.eq(UsageRecord::getStatus, 0);
        Long failCount = usageRecordMapper.selectCount(failWrapper);

        double successRate = 0.0;
        if (successCount + failCount > 0) {
            successRate = (double) successCount / (successCount + failCount) * 100;
        }

        overview.put("totalCount", totalCount);
        overview.put("todayCount", todayCount);
        overview.put("totalTokens", totalTokens);
        overview.put("successRate", Math.round(successRate * 100.0) / 100.0);

        return Result.success(overview);
    }

    /**
     * 获取模型使用统计
     */
    @GetMapping("/model-stats")
    public Result<Map<String, Object>> modelStats() {
        // 简化实现，实际项目中可以使用SQL GROUP BY
        LambdaQueryWrapper<UsageRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.select(UsageRecord::getModelType, UsageRecord::getModelName)
                .eq(UsageRecord::getStatus, 1);

        // 这里简化处理，实际应该使用SQL GROUP BY和COUNT
        Map<String, Object> stats = new HashMap<>();
        stats.put("message", "模型使用统计功能开发中...");

        return Result.success(stats);
    }
}