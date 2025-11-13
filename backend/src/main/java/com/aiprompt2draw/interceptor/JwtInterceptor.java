package com.aiprompt2draw.interceptor;

import cn.hutool.core.util.StrUtil;
import com.aiprompt2draw.exception.BusinessException;
import com.aiprompt2draw.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT认证拦截器
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtils jwtUtils;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // OPTIONS请求直接放行
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        // 获取Authorization头
        String authHeader = request.getHeader("Authorization");

        if (StrUtil.isBlank(authHeader) || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException(401, "未授权,请先登录");
        }

        // 提取Token
        String token = authHeader.substring(7);

        // 验证Token
        if (!jwtUtils.validateToken(token)) {
            throw new BusinessException(401, "Token无效或已过期");
        }

        // 提取用户名并设置到请求属性
        String username = jwtUtils.getUsernameFromToken(token);
        request.setAttribute("username", username);

        return true;
    }
}
