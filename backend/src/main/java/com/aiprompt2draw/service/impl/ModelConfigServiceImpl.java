package com.aiprompt2draw.service.impl;

import com.aiprompt2draw.entity.ModelConfig;
import com.aiprompt2draw.mapper.ModelConfigMapper;
import com.aiprompt2draw.service.IModelConfigService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AI模型配置服务实现类（完整CRUD功能）
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ModelConfigServiceImpl extends ServiceImpl<ModelConfigMapper, ModelConfig> implements IModelConfigService {

    @Override
    public Page<ModelConfig> getModelList(Page<ModelConfig> page, String modelType, Integer status) {
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(modelType)) {
            wrapper.like(ModelConfig::getModelType, modelType);
        }

        if (status != null) {
            wrapper.eq(ModelConfig::getStatus, status);
        }

        wrapper.orderByDesc(ModelConfig::getCreateTime);

        return page(page, wrapper);
    }

    @Override
    public List<ModelConfig> getModelsByType(String modelType, Integer enabled) {
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(modelType)) {
            wrapper.eq(ModelConfig::getModelType, modelType);
        }

        if (enabled != null) {
            wrapper.eq(ModelConfig::getStatus, enabled);
        }

        wrapper.orderByDesc(ModelConfig::getPriority);

        return list(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateModelStatus(Long modelId, Integer status) {
        if (modelId == null || status == null) {
            return false;
        }

        ModelConfig modelConfig = new ModelConfig();
        modelConfig.setId(modelId);
        modelConfig.setStatus(status);
        modelConfig.setUpdateTime(LocalDateTime.now());

        boolean result = updateById(modelConfig);
        if (result) {
            log.info("更新模型状态成功, modelId: {}, status: {}", modelId, status);
        } else {
            log.error("更新模型状态失败, modelId: {}", modelId);
        }
        return result;
    }

    @Override
    public boolean existsByModelName(String modelName) {
        if (!StringUtils.hasText(modelName)) {
            return false;
        }
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModelConfig::getModelName, modelName);
        return count(wrapper) > 0;
    }

    @Override
    public List<ModelConfig> getEnabledModels() {
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModelConfig::getStatus, 1);
        wrapper.orderByDesc(ModelConfig::getPriority);
        return list(wrapper);
    }

    @Override
    public ModelConfig getModelDetail(Long modelId) {
        if (modelId == null) {
            return null;
        }
        return getById(modelId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateModelPriority(Long modelId, Integer priority) {
        if (modelId == null || priority == null) {
            return false;
        }

        ModelConfig modelConfig = new ModelConfig();
        modelConfig.setId(modelId);
        modelConfig.setPriority(priority);
        modelConfig.setUpdateTime(LocalDateTime.now());

        boolean result = updateById(modelConfig);
        if (result) {
            log.info("更新模型优先级成功, modelId: {}, priority: {}", modelId, priority);
        } else {
            log.error("更新模型优先级失败, modelId: {}", modelId);
        }
        return result;
    }

    @Override
    public int countEnabledModelsByType(String modelType) {
        if (!StringUtils.hasText(modelType)) {
            return 0;
        }
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModelConfig::getModelType, modelType);
        wrapper.eq(ModelConfig::getStatus, 1);
        return Math.toIntExact(count(wrapper));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createModel(ModelConfig modelConfig) {
        if (modelConfig == null || !StringUtils.hasText(modelConfig.getModelName())) {
            log.error("创建模型失败，参数不完整");
            return false;
        }

        // 检查模型名称是否已存在
        if (existsByModelName(modelConfig.getModelName())) {
            log.error("模型名称已存在: {}", modelConfig.getModelName());
            return false;
        }

        // 设置默认值
        modelConfig.setStatus(modelConfig.getStatus() != null ? modelConfig.getStatus() : 1);
        modelConfig.setPriority(modelConfig.getPriority() != null ? modelConfig.getPriority() : 0);
        modelConfig.setCreateTime(LocalDateTime.now());
        modelConfig.setUpdateTime(LocalDateTime.now());

        boolean result = save(modelConfig);
        if (result) {
            log.info("创建模型成功: {}", modelConfig.getModelName());
        } else {
            log.error("创建模型失败: {}", modelConfig.getModelName());
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateModel(ModelConfig modelConfig) {
        if (modelConfig == null || modelConfig.getId() == null) {
            log.error("更新模型失败，参数不完整");
            return false;
        }

        // 检查模型是否存在
        ModelConfig existingModel = getById(modelConfig.getId());
        if (existingModel == null) {
            log.error("模型不存在: {}", modelConfig.getId());
            return false;
        }

        // 如果更新了模型名称，检查是否重复
        if (StringUtils.hasText(modelConfig.getModelName()) &&
            !existingModel.getModelName().equals(modelConfig.getModelName()) &&
            existsByModelName(modelConfig.getModelName())) {
            log.error("模型名称已存在: {}", modelConfig.getModelName());
            return false;
        }

        modelConfig.setUpdateTime(LocalDateTime.now());

        boolean result = updateById(modelConfig);
        if (result) {
            log.info("更新模型成功: {}", modelConfig.getId());
        } else {
            log.error("更新模型失败: {}", modelConfig.getId());
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteModel(Long modelId) {
        if (modelId == null) {
            return false;
        }

        boolean result = removeById(modelId);
        if (result) {
            log.info("删除模型成功: {}", modelId);
        } else {
            log.error("删除模型失败: {}", modelId);
        }
        return result;
    }
}