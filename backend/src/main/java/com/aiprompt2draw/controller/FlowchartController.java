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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

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
public class FlowchartController {

    private final FlowchartService flowchartService;
    private final ApiKeyService apiKeyService;

    /**
     * 生成流程图
     */
    @PostMapping("/generate")
    public Result<GenerateResponse> generate(
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
    public Result<QuotaResponse> getQuota(
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
