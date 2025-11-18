package com.aiprompt2draw.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT工具类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Component
public class JwtUtils {

    @Value("${app.admin.jwt.secret}")
    private String secret;

    @Value("${app.admin.jwt.expiration}")
    private Long expiration;

    /**
     * 生成Token
     *
     * @param username 用户名
     * @return Token字符串
     */
    public String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration * 1000);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, secret.getBytes(StandardCharsets.UTF_8))
                .compact();
    }

    /**
     * 生成Token（包含角色和昵称）
     *
     * @param username 用户名
     * @param role 用户角色
     * @param nickname 用户昵称
     * @return Token字符串
     */
    public String createToken(String username, String role, String nickname) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration * 1000);

        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("nickname", nickname)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, secret.getBytes(StandardCharsets.UTF_8))
                .compact();
    }

    /**
     * 解析Token获取用户名
     *
     * @param token Token字符串
     * @return 用户名
     */
    public String getUsernameFromToken(String token) {
        Claims claims = parseToken(token);
        return claims != null ? claims.getSubject() : null;
    }

    /**
     * 从Token中提取用户名（新方法名）
     *
     * @param token Token字符串
     * @return 用户名
     */
    public String extractUsername(String token) {
        return getUsernameFromToken(token);
    }

    /**
     * 从Token中提取角色
     *
     * @param token Token字符串
     * @return 用户角色
     */
    public String extractRole(String token) {
        Claims claims = parseToken(token);
        return claims != null ? claims.get("role", String.class) : null;
    }

    /**
     * 从Token中提取昵称
     *
     * @param token Token字符串
     * @return 用户昵称
     */
    public String extractNickname(String token) {
        Claims claims = parseToken(token);
        return claims != null ? claims.get("nickname", String.class) : null;
    }

    /**
     * 验证Token是否有效
     *
     * @param token Token字符串
     * @return 是否有效
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = parseToken(token);
            return claims != null && !isTokenExpired(claims);
        } catch (Exception e) {
            log.error("Token验证失败", e);
            return false;
        }
    }

    /**
     * 解析Token
     */
    private Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(secret.getBytes(StandardCharsets.UTF_8))
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            log.error("Token解析失败", e);
            return null;
        }
    }

    /**
     * 检查Token是否过期
     */
    private boolean isTokenExpired(Claims claims) {
        Date expiration = claims.getExpiration();
        return expiration.before(new Date());
    }
}
