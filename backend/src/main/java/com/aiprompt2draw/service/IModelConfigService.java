package com.aiprompt2draw.service;

import com.aiprompt2draw.entity.ModelConfig;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * AI模型配置服务接口（完整CRUD功能）
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
public interface IModelConfigService extends IService<ModelConfig> {

    /**
     * 分页查询模型列表
     *
     * @param page 分页对象
     * @param modelType 模型类型（可选）
     * @param status 状态（可选）
     * @return 模型列表
     */
    Page<ModelConfig> getModelList(Page<ModelConfig> page, String modelType, Integer status);

    /**
     * 根据类型获取模型列表
     *
     * @param modelType 模型类型
     * @param enabled 是否启用
     * @return 模型列表
     */
    List<ModelConfig> getModelsByType(String modelType, Integer enabled);

    /**
     * 启用/禁用模型
     *
     * @param modelId 模型ID
     * @param status 状态
     * @return 是否成功
     */
    boolean updateModelStatus(Long modelId, Integer status);

    /**
     * 检查模型是否存在
     *
     * @param modelName 模型名称
     * @return 是否存在
     */
    boolean existsByModelName(String modelName);

    /**
     * 获取启用的模型列表
     *
     * @return 启用的模型列表
     */
    List<ModelConfig> getEnabledModels();

    /**
     * 根据ID获取模型详情
     *
     * @param modelId 模型ID
     * @return 模型详情
     */
    ModelConfig getModelDetail(Long modelId);

    /**
     * 更新模型优先级
     *
     * @param modelId 模型ID
     * @param priority 优先级
     * @return 是否成功
     */
    boolean updateModelPriority(Long modelId, Integer priority);

    /**
     * 根据模型类型获取可用模型数量
     *
     * @param modelType 模型类型
     * @return 可用模型数量
     */
    int countEnabledModelsByType(String modelType);

    /**
     * 创建模型配置
     *
     * @param modelConfig 模型配置
     * @return 是否成功
     */
    boolean createModel(ModelConfig modelConfig);

    /**
     * 更新模型配置
     *
     * @param modelConfig 模型配置
     * @return 是否成功
     */
    boolean updateModel(ModelConfig modelConfig);

    /**
     * 删除模型配置
     *
     * @param modelId 模型ID
     * @return 是否成功
     */
    boolean deleteModel(Long modelId);
}