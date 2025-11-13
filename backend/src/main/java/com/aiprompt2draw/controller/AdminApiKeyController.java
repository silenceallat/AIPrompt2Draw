package com.aiprompt2draw.controller;

import com.aiprompt2draw.dto.CreateApiKeyRequest;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.mapper.ApiKeyMapper;
import com.aiprompt2draw.service.ApiKeyService;
import com.aiprompt2draw.vo.Result;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 后台API Key管理
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/keys")
@RequiredArgsConstructor
@Tag(name = "后台API Key管理", description = "API Key的增删改查接口")
@SecurityRequirement(name = "Bearer")
public class AdminApiKeyController {

    private final ApiKeyService apiKeyService;
    private final ApiKeyMapper apiKeyMapper;

    /**
     * 创建API Key
     */
    @PostMapping
    @Operation(summary = "创建API Key", description = "创建新的API Key")
    public Result<Map<String, Object>> create(@Valid @RequestBody CreateApiKeyRequest request) {
        ApiKey apiKey = apiKeyService.createApiKey(
                request.getKeyType(),
                request.getQuota(),
                request.getRateLimit(),
                request.getExpireDays(),
                request.getRemark()
        );

        Map<String, Object> result = new HashMap<>();
        result.put("keyValue", apiKey.getKeyValue());
        result.put("quota", apiKey.getQuota());
        result.put("expireTime", apiKey.getExpireTime());

        return Result.success(result);
    }

    /**
     * API Key列表
     */
    @GetMapping
    @Operation(summary = "API Key列表", description = "分页查询API Key列表")
    public Result<Map<String, Object>> list(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "20") Integer size,
            @Parameter(description = "状态") @RequestParam(required = false) Integer status,
            @Parameter(description = "Key类型") @RequestParam(required = false) Integer keyType) {

        Page<ApiKey> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<ApiKey> wrapper = new LambdaQueryWrapper<>();

        if (status != null) {
            wrapper.eq(ApiKey::getStatus, status);
        }
        if (keyType != null) {
            wrapper.eq(ApiKey::getKeyType, keyType);
        }

        wrapper.orderByDesc(ApiKey::getCreateTime);

        IPage<ApiKey> pageResult = apiKeyMapper.selectPage(pageParam, wrapper);

        Map<String, Object> result = new HashMap<>();
        result.put("total", pageResult.getTotal());
        result.put("list", pageResult.getRecords());

        return Result.success(result);
    }

    /**
     * 更新API Key
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新API Key", description = "更新API Key的额度、状态等")
    public Result<Void> update(
            @Parameter(description = "API Key ID") @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {

        ApiKey apiKey = apiKeyMapper.selectById(id);
        if (apiKey == null) {
            return Result.error(404, "API Key不存在");
        }

        // 更新字段
        if (updates.containsKey("quota")) {
            apiKey.setQuota((Integer) updates.get("quota"));
        }
        if (updates.containsKey("status")) {
            apiKey.setStatus((Integer) updates.get("status"));
        }
        if (updates.containsKey("remark")) {
            apiKey.setRemark((String) updates.get("remark"));
        }

        apiKeyMapper.updateById(apiKey);

        // 清除缓存
        apiKeyService.clearCache(apiKey.getKeyValue());

        return Result.success();
    }

    /**
     * 删除API Key
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除API Key", description = "删除指定的API Key")
    public Result<Void> delete(@Parameter(description = "API Key ID") @PathVariable Long id) {
        ApiKey apiKey = apiKeyMapper.selectById(id);
        if (apiKey != null) {
            apiKeyMapper.deleteById(id);
            apiKeyService.clearCache(apiKey.getKeyValue());
        }
        return Result.success();
    }
}
