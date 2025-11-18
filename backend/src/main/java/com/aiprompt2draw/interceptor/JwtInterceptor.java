package com.aiprompt2draw.interceptor;

import cn.hutool.core.util.StrUtil;
import com.aiprompt2draw.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // OPTIONS请求直接放行
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        // 获取Authorization头
        String authHeader = request.getHeader("Authorization");

        if (StrUtil.isBlank(authHeader)) {
            handleAuthFailure(response, 401, "未授权,请先登录");
            return false;
        }

        // 提取Token
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

        // 验证Token
        if (!jwtUtils.validateToken(token)) {
            handleAuthFailure(response, 401, "Token无效或已过期");
            return false;
        }

        // 提取用户名并设置到请求属性
        String username = jwtUtils.getUsernameFromToken(token);
        request.setAttribute("username", username);

        return true;
    }

    /**
     * 处理认证失败，返回特定格式的JSON响应
     */
    private void handleAuthFailure(HttpServletResponse response, int code, String message) throws Exception {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String jsonResponse = String.format(
            "{\"success\":false,\"code\":%d,\"message\":\"%s\",\"data\":null,\"tokenExpired\":true}",
            code, message
        );

        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }
}
