package com.aiprompt2draw.controller;

import com.aiprompt2draw.dto.CreateModelConfigRequest;
import com.aiprompt2draw.entity.ModelConfig;
import com.aiprompt2draw.mapper.ModelConfigMapper;
import com.aiprompt2draw.utils.EncryptUtils;
import com.aiprompt2draw.vo.Result;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 后台AI模型管理
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/models")
@RequiredArgsConstructor
public class AdminModelController {

    private final ModelConfigMapper modelConfigMapper;
    private final EncryptUtils encryptUtils;

    /**
     * 获取模型配置列表
     */
    @GetMapping
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String modelType) {

        Page<ModelConfig> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();

        if (status != null) {
            wrapper.eq(ModelConfig::getStatus, status);
        }
        if (modelType != null && !modelType.trim().isEmpty()) {
            wrapper.like(ModelConfig::getModelType, modelType);
        }

        wrapper.orderByDesc(ModelConfig::getPriority);
        wrapper.orderByDesc(ModelConfig::getCreateTime);

        IPage<ModelConfig> pageResult = modelConfigMapper.selectPage(pageParam, wrapper);

        // 解密API Key（不返回完整密钥，只返回前几位）
        pageResult.getRecords().forEach(model -> {
            if (model.getApiKey() != null && model.getApiKey().length() > 8) {
                model.setApiKey(model.getApiKey().substring(0, 8) + "...");
            }
        });

        Map<String, Object> result = new HashMap<>();
        result.put("total", pageResult.getTotal());
        result.put("list", pageResult.getRecords());

        return Result.success(result);
    }

    /**
     * 创建模型配置
     */
    @PostMapping
    public Result<ModelConfig> create(@Valid @RequestBody CreateModelConfigRequest request) {
        // 检查模型类型是否已存在
        LambdaQueryWrapper<ModelConfig> checkWrapper = new LambdaQueryWrapper<>();
        checkWrapper.eq(ModelConfig::getModelType, request.getModelType());
        ModelConfig existingModel = modelConfigMapper.selectOne(checkWrapper);

        if (existingModel != null) {
            return Result.error(400, "模型类型已存在，请使用不同的类型");
        }

        ModelConfig modelConfig = new ModelConfig();
        modelConfig.setModelType(request.getModelType());
        modelConfig.setModelName(request.getModelName());
        modelConfig.setApiKey(encryptUtils.encrypt(request.getApiKey()));
        modelConfig.setApiUrl(request.getApiUrl());
        modelConfig.setApiSecret(request.getApiSecret() != null ?
            encryptUtils.encrypt(request.getApiSecret()) : null);
        modelConfig.setMaxTokens(request.getMaxTokens() != null ? request.getMaxTokens() : 2000);
        modelConfig.setTemperature(request.getTemperature() != null ?
            request.getTemperature() : new BigDecimal("0.7"));
        modelConfig.setPriority(request.getPriority());
        modelConfig.setStatus(1); // 默认启用
        modelConfig.setCostPerTkPromptTokens(request.getCostPer1kPromptTokens());
        modelConfig.setCostPerTkCompletionTokens(request.getCostPer1kCompletionTokens());
        modelConfig.setRemark(request.getRemark());
        modelConfig.setCreateTime(LocalDateTime.now());
        modelConfig.setUpdateTime(LocalDateTime.now());
        modelConfig.setDeleted(0);

        modelConfigMapper.insert(modelConfig);

        log.info("创建模型配置成功: modelType={}, modelName={}",
                request.getModelType(), request.getModelName());

        // 返回时隐藏敏感信息
        modelConfig.setApiKey("******");
        modelConfig.setApiSecret(null);

        return Result.success(modelConfig);
    }

    /**
     * 更新模型配置
     */
    @PutMapping("/{id}")
    public Result<ModelConfig> update(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        ModelConfig modelConfig = modelConfigMapper.selectById(id);
        if (modelConfig == null) {
            return Result.error(404, "模型配置不存在");
        }

        // 更新字段
        if (updates.containsKey("modelName")) {
            modelConfig.setModelName((String) updates.get("modelName"));
        }
        if (updates.containsKey("apiKey")) {
            modelConfig.setApiKey(encryptUtils.encrypt((String) updates.get("apiKey")));
        }
        if (updates.containsKey("apiUrl")) {
            modelConfig.setApiUrl((String) updates.get("apiUrl"));
        }
        if (updates.containsKey("apiSecret")) {
            String secret = (String) updates.get("apiSecret");
            modelConfig.setApiSecret(secret != null ? encryptUtils.encrypt(secret) : null);
        }
        if (updates.containsKey("maxTokens")) {
            modelConfig.setMaxTokens((Integer) updates.get("maxTokens"));
        }
        if (updates.containsKey("temperature")) {
            modelConfig.setTemperature(new BigDecimal(updates.get("temperature").toString()));
        }
        if (updates.containsKey("priority")) {
            modelConfig.setPriority((Integer) updates.get("priority"));
        }
        if (updates.containsKey("status")) {
            modelConfig.setStatus((Integer) updates.get("status"));
        }
        if (updates.containsKey("costPer1kPromptTokens")) {
            modelConfig.setCostPerTkPromptTokens(new BigDecimal(updates.get("costPer1kPromptTokens").toString()));
        }
        if (updates.containsKey("costPer1kCompletionTokens")) {
            modelConfig.setCostPerTkCompletionTokens(new BigDecimal(updates.get("costPer1kCompletionTokens").toString()));
        }
        if (updates.containsKey("remark")) {
            modelConfig.setRemark((String) updates.get("remark"));
        }

        modelConfig.setUpdateTime(LocalDateTime.now());
        modelConfigMapper.updateById(modelConfig);

        log.info("更新模型配置成功: id={}, modelType={}", id, modelConfig.getModelType());

        // 返回时隐藏敏感信息
        modelConfig.setApiKey("******");
        modelConfig.setApiSecret(null);

        return Result.success(modelConfig);
    }

    /**
     * 删除模型配置（逻辑删除）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        ModelConfig modelConfig = modelConfigMapper.selectById(id);
        if (modelConfig == null) {
            return Result.error(404, "模型配置不存在");
        }

        // 逻辑删除
        modelConfig.setDeleted(1);
        modelConfig.setUpdateTime(LocalDateTime.now());
        modelConfigMapper.updateById(modelConfig);

        log.info("删除模型配置成功: id={}, modelType={}", id, modelConfig.getModelType());

        return Result.success();
    }

    /**
     * 启用/禁用模型
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        ModelConfig modelConfig = modelConfigMapper.selectById(id);
        if (modelConfig == null) {
            return Result.error(404, "模型配置不存在");
        }

        modelConfig.setStatus(status);
        modelConfig.setUpdateTime(LocalDateTime.now());
        modelConfigMapper.updateById(modelConfig);

        String action = status == 1 ? "启用" : "禁用";
        log.info("{}模型配置成功: id={}, modelType={}", action, id, modelConfig.getModelType());

        return Result.success();
    }

    /**
     * 获取模型详情
     */
    @GetMapping("/{id}")
    public Result<ModelConfig> getById(@PathVariable Long id) {
        ModelConfig modelConfig = modelConfigMapper.selectById(id);
        if (modelConfig == null) {
            return Result.error(404, "模型配置不存在");
        }

        // 返回时隐藏敏感信息
        if (modelConfig.getApiKey() != null && modelConfig.getApiKey().length() > 8) {
            modelConfig.setApiKey(modelConfig.getApiKey().substring(0, 8) + "...");
        }
        modelConfig.setApiSecret(null);

        return Result.success(modelConfig);
    }
}
