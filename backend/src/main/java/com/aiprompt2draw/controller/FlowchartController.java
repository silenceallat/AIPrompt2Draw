package com.aiprompt2draw.controller;

import com.aiprompt2draw.dto.AIResponse;
import com.aiprompt2draw.dto.GenerateRequest;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.enums.ApiKeyType;
import com.aiprompt2draw.service.ApiKeyService;
import com.aiprompt2draw.service.FlowchartService;
import com.aiprompt2draw.utils.IpUtils;
import com.aiprompt2draw.vo.GenerateResponse;
import com.aiprompt2draw.vo.QuotaResponse;
import com.aiprompt2draw.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 流程图生成API
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "流程图生成API", description = "提供流程图生成和额度查询接口")
public class FlowchartController {

    private final FlowchartService flowchartService;
    private final ApiKeyService apiKeyService;

    /**
     * 生成流程图
     */
    @PostMapping("/generate")
    @Operation(summary = "生成流程图", description = "根据用户输入的描述生成流程图XML")
    public Result<GenerateResponse> generate(
            @Parameter(description = "API Key", required = true)
            @RequestHeader("X-API-Key") String apiKey,
            @Valid @RequestBody GenerateRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtils.getIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // 调用服务生成流程图
        AIResponse aiResponse = flowchartService.generate(
                apiKey,
                request.getPrompt(),
                request.getModelType(),
                ipAddress,
                userAgent
        );

        // 获取剩余额度
        Integer remainingQuota = apiKeyService.getQuota(apiKey);

        // 构建响应
        GenerateResponse response = new GenerateResponse(
                aiResponse.getXmlContent(),
                remainingQuota,
                request.getModelType(),
                aiResponse.getTotalTokens()
        );

        return Result.success(response);
    }

    /**
     * 查询额度
     */
    @GetMapping("/quota")
    @Operation(summary = "查询额度", description = "查询API Key的剩余额度信息")
    public Result<QuotaResponse> getQuota(
            @Parameter(description = "API Key", required = true)
            @RequestHeader("X-API-Key") String apiKeyValue) {

        // 验证API Key
        ApiKey apiKey = apiKeyService.validateApiKey(apiKeyValue);

        // 获取剩余额度
        Integer remainingQuota = apiKeyService.getQuota(apiKeyValue);

        // 转换Key类型
        String keyTypeStr = switch (ApiKeyType.getByCode(apiKey.getKeyType())) {
            case TRIAL -> "trial";
            case PAID -> "paid";
            case VIP -> "vip";
        };

        // 构建响应
        QuotaResponse response = new QuotaResponse(
                remainingQuota,
                apiKey.getTotalQuota(),
                keyTypeStr,
                apiKey.getExpireTime()
        );

        return Result.success(response);
    }
}
