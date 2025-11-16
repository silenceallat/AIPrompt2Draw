package com.aiprompt2draw.controller;

import com.aiprompt2draw.entity.ModelConfig;
import com.aiprompt2draw.service.IModelConfigService;
import com.aiprompt2draw.vo.Result;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI模型配置管理控制器
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/models2")
@RequiredArgsConstructor
public class ModelConfigController {

    private final IModelConfigService modelConfigService;

    /**
     * 获取模型列表
     */
    @GetMapping("/list")
    public Result<Page<ModelConfig>> getModelList(@RequestParam(defaultValue = "1") Integer current,
                                                 @RequestParam(defaultValue = "10") Integer size,
                                                 @RequestParam(required = false) String modelType,
                                                 @RequestParam(required = false) Integer status) {
        try {
            Page<ModelConfig> page = new Page<>(current, size);
            Page<ModelConfig> result = modelConfigService.getModelList(page, modelType, status);
            return Result.success("获取模型列表成功", result);
        } catch (Exception e) {
            log.error("获取模型列表失败", e);
            return Result.error("获取模型列表失败：" + e.getMessage());
        }
    }

    /**
     * 获取模型详情
     */
    @GetMapping("/{modelId}")
    public Result<ModelConfig> getModelDetail(@PathVariable Long modelId) {
        try {
            ModelConfig modelConfig = modelConfigService.getModelDetail(modelId);
            if (modelConfig == null) {
                return Result.error("模型不存在");
            }
            return Result.success("获取模型详情成功", modelConfig);
        } catch (Exception e) {
            log.error("获取模型详情失败", e);
            return Result.error("获取模型详情失败：" + e.getMessage());
        }
    }

    /**
     * 创建模型配置
     */
    @PostMapping
    public Result<String> createModel(@Valid @RequestBody ModelConfig modelConfig) {
        try {
            boolean success = modelConfigService.createModel(modelConfig);
            if (success) {
                return Result.success("创建模型成功");
            } else {
                return Result.error("创建模型失败");
            }
        } catch (Exception e) {
            log.error("创建模型失败", e);
            return Result.error("创建模型失败：" + e.getMessage());
        }
    }

    /**
     * 更新模型配置
     */
    @PutMapping("/{modelId}")
    public Result<String> updateModel(@PathVariable Long modelId, @Valid @RequestBody ModelConfig modelConfig) {
        try {
            modelConfig.setId(modelId);
            boolean success = modelConfigService.updateModel(modelConfig);
            if (success) {
                return Result.success("更新模型成功");
            } else {
                return Result.error("更新模型失败");
            }
        } catch (Exception e) {
            log.error("更新模型失败", e);
            return Result.error("更新模型失败：" + e.getMessage());
        }
    }

    /**
     * 删除模型配置
     */
    @DeleteMapping("/{modelId}")
    public Result<String> deleteModel(@PathVariable Long modelId) {
        try {
            boolean success = modelConfigService.deleteModel(modelId);
            if (success) {
                return Result.success("删除模型成功");
            } else {
                return Result.error("删除模型失败");
            }
        } catch (Exception e) {
            log.error("删除模型失败", e);
            return Result.error("删除模型失败：" + e.getMessage());
        }
    }

    /**
     * 启用/禁用模型
     */
    @PutMapping("/{modelId}/status")
    public Result<String> updateModelStatus(@PathVariable Long modelId,
                                           @RequestBody Map<String, Integer> statusRequest) {
        try {
            Integer status = statusRequest.get("status");
            if (status == null || (status != 0 && status != 1)) {
                return Result.error("状态值无效");
            }

            boolean success = modelConfigService.updateModelStatus(modelId, status);
            if (success) {
                String message = status == 1 ? "模型启用成功" : "模型禁用成功";
                return Result.success(message);
            } else {
                return Result.error("操作失败");
            }
        } catch (Exception e) {
            log.error("更新模型状态失败", e);
            return Result.error("操作失败：" + e.getMessage());
        }
    }

    /**
     * 更新模型优先级
     */
    @PutMapping("/{modelId}/priority")
    public Result<String> updateModelPriority(@PathVariable Long modelId,
                                              @RequestBody Map<String, Integer> priorityRequest) {
        try {
            Integer priority = priorityRequest.get("priority");
            if (priority == null) {
                return Result.error("优先级值无效");
            }

            boolean success = modelConfigService.updateModelPriority(modelId, priority);
            if (success) {
                return Result.success("更新模型优先级成功");
            } else {
                return Result.error("更新模型优先级失败");
            }
        } catch (Exception e) {
            log.error("更新模型优先级失败", e);
            return Result.error("更新模型优先级失败：" + e.getMessage());
        }
    }

    /**
     * 获取启用的模型列表
     */
    @GetMapping("/enabled")
    public Result<List<ModelConfig>> getEnabledModels() {
        try {
            List<ModelConfig> models = modelConfigService.getEnabledModels();
            return Result.success("获取启用模型列表成功", models);
        } catch (Exception e) {
            log.error("获取启用模型列表失败", e);
            return Result.error("获取启用模型列表失败：" + e.getMessage());
        }
    }

    /**
     * 根据类型获取模型列表
     */
    @GetMapping("/type/{modelType}")
    public Result<List<ModelConfig>> getModelsByType(@PathVariable String modelType,
                                                   @RequestParam(required = false) Integer enabled) {
        try {
            List<ModelConfig> models = modelConfigService.getModelsByType(modelType, enabled);
            return Result.success("获取模型列表成功", models);
        } catch (Exception e) {
            log.error("获取模型列表失败", e);
            return Result.error("获取模型列表失败：" + e.getMessage());
        }
    }

    /**
     * 获取模型统计信息
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> getModelStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            // 总模型数
            int totalModels = Math.toIntExact(modelConfigService.count());
            stats.put("totalModels", totalModels);

            // 启用模型数
            List<ModelConfig> enabledModels = modelConfigService.getEnabledModels();
            stats.put("enabledModels", enabledModels.size());

            // 按类型统计
            Map<String, Integer> typeStats = new HashMap<>();
            for (ModelConfig model : enabledModels) {
                String type = model.getModelType();
                typeStats.put(type, typeStats.getOrDefault(type, 0) + 1);
            }
            stats.put("typeStats", typeStats);

            return Result.success("获取模型统计信息成功", stats);
        } catch (Exception e) {
            log.error("获取模型统计信息失败", e);
            return Result.error("获取模型统计信息失败：" + e.getMessage());
        }
    }

    /**
     * 批量更新模型状态
     */
    @PutMapping("/batch/status")
    public Result<String> batchUpdateModelStatus(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> modelIds = (List<Long>) request.get("modelIds");
            Integer status = (Integer) request.get("status");

            if (modelIds == null || modelIds.isEmpty() || status == null || (status != 0 && status != 1)) {
                return Result.error("参数无效");
            }

            int successCount = 0;
            for (Long modelId : modelIds) {
                if (modelConfigService.updateModelStatus(modelId, status)) {
                    successCount++;
                }
            }

            String message = String.format("批量更新完成，成功：%d，失败：%d", successCount, modelIds.size() - successCount);
            return Result.success(message);
        } catch (Exception e) {
            log.error("批量更新模型状态失败", e);
            return Result.error("批量更新失败：" + e.getMessage());
        }
    }
}
