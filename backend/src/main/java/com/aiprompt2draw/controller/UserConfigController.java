package com.aiprompt2draw.controller;

import com.aiprompt2draw.converter.UserConfigConverter;
import com.aiprompt2draw.dto.UserConfigDTO;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.entity.UserConfig;
import com.aiprompt2draw.service.ApiKeyService;
import com.aiprompt2draw.service.UserConfigService;
import com.aiprompt2draw.vo.Result;
import com.aiprompt2draw.vo.UserConfigVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户配置管理控制器
 * 提供用户配置相关API接口
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
@Validated
public class UserConfigController {

    private final ApiKeyService apiKeyService;
    private final UserConfigService userConfigService;
    private final UserConfigConverter userConfigConverter;

    /**
     * 获取API Key ID的通用方法
     */
    private Long getApiKeyId(String apiKey) {
        ApiKey apiKeyEntity = apiKeyService.validateApiKey(apiKey);
        return apiKeyEntity != null ? apiKeyEntity.getId() : null;
    }

    /**
     * 获取用户配置列表
     */
    @GetMapping("/configs")
    public Result<List<UserConfigVO>> getUserConfigs(
            @RequestHeader("X-API-Key") String apiKey,
            @RequestParam(required = false) String configType) {
        try {
            Long apiKeyId = getApiKeyId(apiKey);
            if (apiKeyId == null) {
                return Result.error(401, "无效的API Key");
            }

            log.info("获取用户配置列表，API Key ID: {}, 配置类型: {}", apiKeyId, configType);

            List<UserConfigVO> configs;
            if (configType != null && !configType.trim().isEmpty()) {
                UserConfig config = userConfigService.getConfigByApiKeyIdAndType(apiKeyId, configType);
                configs = config != null ? List.of(userConfigConverter.toVO(config)) : List.of();
            } else {
                configs = userConfigConverter.toVOList(userConfigService.getConfigsByApiKeyId(apiKeyId));
            }

            return Result.success(configs);
        } catch (Exception e) {
            log.error("获取用户配置列表失败", e);
            return Result.error(500, "获取配置列表失败: " + e.getMessage());
        }
    }

    /**
     * 获取单个用户配置
     */
    @GetMapping("/configs/{configId}")
    public Result<UserConfigVO> getUserConfig(
            @RequestHeader("X-API-Key") String apiKey,
            @PathVariable @NotNull Long configId) {
        try {
            Long apiKeyId = getApiKeyId(apiKey);
            if (apiKeyId == null) {
                return Result.error(401, "无效的API Key");
            }

            log.info("获取用户配置，API Key ID: {}, 配置ID: {}", apiKeyId, configId);

            var config = userConfigService.getById(configId);
            if (config == null || !config.getApiKeyId().equals(apiKeyId)) {
                return Result.error(404, "配置不存在或无权限访问");
            }

            return Result.success(userConfigConverter.toVO(config));
        } catch (Exception e) {
            log.error("获取用户配置失败", e);
            return Result.error(500, "获取配置失败: " + e.getMessage());
        }
    }

    /**
     * 创建用户配置
     */
    @PostMapping("/configs")
    public Result<UserConfigVO> createUserConfig(
            @RequestHeader("X-API-Key") String apiKey,
            @RequestBody @Valid UserConfigDTO configDTO) {
        try {
            Long apiKeyId = getApiKeyId(apiKey);
            if (apiKeyId == null) {
                return Result.error(401, "无效的API Key");
            }

            log.info("创建用户配置，API Key ID: {}, 配置名称: {}, 类型: {}",
                    apiKeyId, configDTO.getConfigName(), configDTO.getConfigType());

            var config = userConfigConverter.toEntity(configDTO, apiKeyId);
            var savedConfig = userConfigService.saveOrUpdateConfig(config);

            return Result.success(userConfigConverter.toVO(savedConfig));
        } catch (Exception e) {
            log.error("创建用户配置失败", e);
            return Result.error(500, "创建配置失败: " + e.getMessage());
        }
    }

    /**
     * 更新用户配置
     */
    @PutMapping("/configs/{configId}")
    public Result<UserConfigVO> updateUserConfig(
            @RequestHeader("X-API-Key") String apiKey,
            @PathVariable @NotNull Long configId,
            @RequestBody @Valid UserConfigDTO configDTO) {
        try {
            Long apiKeyId = getApiKeyId(apiKey);
            if (apiKeyId == null) {
                return Result.error(401, "无效的API Key");
            }

            log.info("更新用户配置，API Key ID: {}, 配置ID: {}, 配置名称: {}",
                    apiKeyId, configId, configDTO.getConfigName());

            var existingConfig = userConfigService.getById(configId);
            if (existingConfig == null || !existingConfig.getApiKeyId().equals(apiKeyId)) {
                return Result.error(404, "配置不存在或无权限访问");
            }

            configDTO.setId(configId);
            var updatedConfig = userConfigService.saveOrUpdateConfig(
                    userConfigConverter.updateEntity(existingConfig, configDTO));

            return Result.success(userConfigConverter.toVO(updatedConfig));
        } catch (Exception e) {
            log.error("更新用户配置失败", e);
            return Result.error(500, "更新配置失败: " + e.getMessage());
        }
    }

    /**
     * 设置默认配置
     */
    @PutMapping("/configs/{configId}/default")
    public Result<String> setDefaultConfig(
            @RequestHeader("X-API-Key") String apiKey,
            @PathVariable @NotNull Long configId) {
        try {
            Long apiKeyId = getApiKeyId(apiKey);
            if (apiKeyId == null) {
                return Result.error(401, "无效的API Key");
            }

            log.info("设置默认配置，API Key ID: {}, 配置ID: {}", apiKeyId, configId);

            boolean success = userConfigService.setAsDefault(configId, apiKeyId);
            if (!success) {
                return Result.error(404, "配置不存在或无权限访问");
            }

            return Result.success("默认配置设置成功");
        } catch (Exception e) {
            log.error("设置默认配置失败", e);
            return Result.error(500, "设置默认配置失败: " + e.getMessage());
        }
    }

    /**
     * 删除用户配置
     */
    @DeleteMapping("/configs/{configId}")
    public Result<String> deleteUserConfig(
            @RequestHeader("X-API-Key") String apiKey,
            @PathVariable @NotNull Long configId) {
        try {
            Long apiKeyId = getApiKeyId(apiKey);
            if (apiKeyId == null) {
                return Result.error(401, "无效的API Key");
            }

            log.info("删除用户配置，API Key ID: {}, 配置ID: {}", apiKeyId, configId);

            boolean success = userConfigService.deleteConfig(configId, apiKeyId);
            if (!success) {
                return Result.error(404, "配置不存在或无权限访问");
            }

            return Result.success("配置删除成功");
        } catch (Exception e) {
            log.error("删除用户配置失败", e);
            return Result.error(500, "删除配置失败: " + e.getMessage());
        }
    }

    /**
     * 导出用户配置
     */
    @GetMapping("/configs/export")
    public Result<Map<String, Object>> exportUserConfigs(
            @RequestHeader("X-API-Key") String apiKey) {
        try {
            Long apiKeyId = getApiKeyId(apiKey);
            if (apiKeyId == null) {
                return Result.error(401, "无效的API Key");
            }

            log.info("导出用户配置，API Key ID: {}", apiKeyId);

            var configs = userConfigService.getConfigsByApiKeyId(apiKeyId);
            var configVOs = userConfigConverter.toVOList(configs);

            Map<String, Object> exportData = new HashMap<>();
            exportData.put("configs", configVOs);
            exportData.put("exportTime", System.currentTimeMillis());
            exportData.put("apiKeyId", apiKeyId);

            return Result.success(exportData);
        } catch (Exception e) {
            log.error("导出用户配置失败", e);
            return Result.error(500, "导出配置失败: " + e.getMessage());
        }
    }

    /**
     * 导入用户配置
     */
    @PostMapping("/configs/import")
    public Result<String> importUserConfigs(
            @RequestHeader("X-API-Key") String apiKey,
            @RequestBody Map<String, Object> importData) {
        try {
            Long apiKeyId = getApiKeyId(apiKey);
            if (apiKeyId == null) {
                return Result.error(401, "无效的API Key");
            }

            log.info("导入用户配置，API Key ID: {}", apiKeyId);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> configs = (List<Map<String, Object>>) importData.get("configs");
            if (configs == null || configs.isEmpty()) {
                return Result.error(400, "导入数据格式错误");
            }

            int successCount = 0;
            for (Map<String, Object> configMap : configs) {
                try {
                    UserConfigDTO configDTO = new UserConfigDTO();
                    configDTO.setConfigName((String) configMap.get("configName"));
                    configDTO.setConfigType((String) configMap.get("configType"));
                    configDTO.setConfigContent((String) configMap.get("configContent"));
                    configDTO.setIsDefault((Boolean) configMap.get("isDefault"));
                    configDTO.setRemark((String) configMap.get("remark"));

                    var config = userConfigConverter.toEntity(configDTO, apiKeyId);
                    userConfigService.saveOrUpdateConfig(config);
                    successCount++;
                } catch (Exception e) {
                    log.warn("导入单个配置失败: {}", configMap.get("configName"), e);
                }
            }

            return Result.success("配置导入完成，成功导入 " + successCount + " 个配置");
        } catch (Exception e) {
            log.error("导入用户配置失败", e);
            return Result.error(500, "导入配置失败: " + e.getMessage());
        }
    }

    /**
     * 获取用户配置信息
     */
    @GetMapping("/config")
    public Result<Map<String, Object>> getUserConfig(
            @RequestHeader("X-API-Key") String apiKey) {
        try {
            log.info("获取用户配置，API Key: {}", apiKey.substring(0, Math.min(10, apiKey.length())) + "...");

            // 验证API Key
            ApiKey apiKeyEntity = apiKeyService.validateApiKey(apiKey);
            if (apiKeyEntity == null) {
                return Result.error(401, "无效的API Key");
            }

            // 获取用户配额信息
            Integer quota = apiKeyService.getQuota(apiKey);
            Map<String, Object> quotaInfo = new HashMap<>();
            quotaInfo.put("remainingQuota", quota);
            quotaInfo.put("apiKeyId", apiKeyEntity.getId());

            // 构建配置信息
            Map<String, Object> config = new HashMap<>();
            config.put("apiKey", apiKey);
            config.put("quota", quotaInfo);
            config.put("features", getAvailableFeatures());
            config.put("supportedModels", getSupportedModels());

            return Result.success(config);
        } catch (Exception e) {
            log.error("获取用户配置失败", e);
            return Result.error(500, "获取配置信息失败: " + e.getMessage());
        }
    }

    /**
     * 更新用户配置
     */
    @PostMapping("/config")
    public Result<String> updateUserConfig(
            @RequestHeader("X-API-Key") String apiKey,
            @RequestBody Map<String, Object> config) {
        try {
            log.info("更新用户配置，API Key: {}", apiKey.substring(0, Math.min(10, apiKey.length())) + "...");

            // 验证API Key
            ApiKey apiKeyEntity = apiKeyService.validateApiKey(apiKey);
            if (apiKeyEntity == null) {
                return Result.error(401, "无效的API Key");
            }

            // 这里可以扩展更多配置项
            // 目前主要是验证API Key的有效性

            return Result.success("配置更新成功");
        } catch (Exception e) {
            log.error("更新用户配置失败", e);
            return Result.error(500, "更新配置失败: " + e.getMessage());
        }
    }

    /**
     * 获取可用功能列表
     */
    @GetMapping("/features")
    public Result<Map<String, Object>> getFeatures() {
        try {
            Map<String, Object> features = getAvailableFeatures();
            return Result.success(features);
        } catch (Exception e) {
            log.error("获取功能列表失败", e);
            return Result.error(500, "获取功能列表失败: " + e.getMessage());
        }
    }

    /**
     * 获取支持的模型列表
     */
    @GetMapping("/models")
    public Result<Map<String, Object>> getModels() {
        try {
            Map<String, Object> models = getSupportedModels();
            return Result.success(models);
        } catch (Exception e) {
            log.error("获取模型列表失败", e);
            return Result.error(500, "获取模型列表失败: " + e.getMessage());
        }
    }

    /**
     * 获取系统状态信息
     */
    @GetMapping("/status")
    public Result<Map<String, Object>> getSystemStatus() {
        try {
            Map<String, Object> status = new HashMap<>();
            status.put("system", "AIPrompt2Draw Backend");
            status.put("version", "1.0.0");
            status.put("status", "running");
            status.put("timestamp", System.currentTimeMillis());

            return Result.success(status);
        } catch (Exception e) {
            log.error("获取系统状态失败", e);
            return Result.error(500, "获取系统状态失败: " + e.getMessage());
        }
    }

    /**
     * 获取可用功能配置
     */
    private Map<String, Object> getAvailableFeatures() {
        Map<String, Object> features = new HashMap<>();
        features.put("flowchart_generation", true);
        features.put("quota_management", true);
        features.put("usage_history", true);
        features.put("export_formats", new String[]{"xml", "png", "svg", "pdf"});
        features.put("streaming_support", true);
        return features;
    }

    /**
     * 获取支持的模型配置
     */
    private Map<String, Object> getSupportedModels() {
        Map<String, Object> models = new HashMap<>();
        models.put("openai", new String[]{"gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"});
        models.put("claude", new String[]{"claude-3-haiku", "claude-3-sonnet", "claude-3-opus"});
        models.put("zhipu", new String[]{"glm-4", "glm-3-turbo"});
        models.put("siliconflow", new String[]{"qwen", "deepseek", "glm"});
        return models;
    }
}