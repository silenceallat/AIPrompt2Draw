package com.aiprompt2draw.controller;

import com.aiprompt2draw.dto.AIResponse;
import com.aiprompt2draw.dto.GenerateRequest;
import com.aiprompt2draw.dto.UserGenerateRequest;
import com.aiprompt2draw.entity.ApiKey;
import com.aiprompt2draw.entity.User;
import com.aiprompt2draw.enums.ApiKeyType;
import com.aiprompt2draw.service.ApiKeyService;
import com.aiprompt2draw.service.FlowchartService;
import com.aiprompt2draw.service.UserService;
import com.aiprompt2draw.utils.IpUtils;
import com.aiprompt2draw.utils.JwtUtils;
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
    private final UserService userService;
    private final JwtUtils jwtUtils;

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

    /**
     * 用户查询额度（JWT认证）
     */
    @GetMapping("/user/quota")
    public Result<QuotaResponse> getUserQuota(
            @RequestHeader("Authorization") String token) {

        try {
            // 从Token中获取用户信息
            String username = jwtUtils.getUsernameFromToken(token);
            User user = userService.findByUsername(username);

            if (user == null) {
                return Result.error("用户不存在");
            }

            // TODO: 实现用户配额查询逻辑
            // 这里暂时返回无限配额
            QuotaResponse response = new QuotaResponse(
                    -1, // 无限配额
                    -1, // 无限总额度
                    "unlimited",
                    null // 无过期时间
            );

            return Result.success(response);

        } catch (Exception e) {
            log.error("查询用户配额失败", e);
            return Result.error("查询配额失败：" + e.getMessage());
        }
    }

    /**
     * 用户生成流程图（JWT认证）
     */
    @PostMapping("/user/generate")
    public Result<GenerateResponse> userGenerate(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody UserGenerateRequest request,
            HttpServletRequest httpRequest) {

        try {
            // 从Token中获取用户信息
            String username = jwtUtils.getUsernameFromToken(token);
            User user = userService.findByUsername(username);

            if (user == null) {
                return Result.error("用户不存在");
            }

            String ipAddress = IpUtils.getIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            // 注意：当前版本中，API Key由前端在配置中管理
            // 用户认证仅用于验证用户身份和权限控制
            // 实际的API调用使用前端配置的API Key

            // 由于架构设计变更，这里暂时返回模拟响应
            // 实际实现需要重新设计API Key管理机制
            AIResponse aiResponse = new AIResponse();
            aiResponse.setXmlContent(this.generateMockXML(request.getPrompt()));
            aiResponse.setTotalTokens(100);

            // 构建响应
            GenerateResponse response = new GenerateResponse(
                    aiResponse.getXmlContent(),
                    null, // 用户模式下不返回配额信息
                    request.getModel(),
                    aiResponse.getTotalTokens()
            );

            return Result.success(response);

        } catch (Exception e) {
            log.error("用户生成流程图失败", e);
            return Result.error("生成失败：" + e.getMessage());
        }
    }

    /**
     * 生成模拟XML响应
     */
    private String generateMockXML(String prompt) {
        return String.format("""
            <mxGraphModel>
                <root>
                    <mxCell id="0"/>
                    <mxCell id="1" parent="0" value="%s">
                        <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
                    </mxCell>
                    <mxCell id="2" parent="0" value="处理流程">
                        <mxGeometry x="280" y="100" width="120" height="60" as="geometry"/>
                    </mxCell>
                    <mxCell id="3" parent="0" value="输出结果">
                        <mxGeometry x="460" y="100" width="120" height="60" as="geometry"/>
                    </mxCell>
                </root>
            </mxGraphModel>
            """, prompt.length() > 20 ? prompt.substring(0, 20) + "..." : prompt);
    }
}
