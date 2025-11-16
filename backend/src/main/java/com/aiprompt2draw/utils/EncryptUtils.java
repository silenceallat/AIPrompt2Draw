package com.aiprompt2draw.utils;

import cn.hutool.crypto.digest.DigestUtil;
import cn.hutool.crypto.digest.MD5;
import cn.hutool.crypto.symmetric.AES;
import cn.hutool.crypto.symmetric.SymmetricAlgorithm;
import cn.hutool.crypto.symmetric.SymmetricCrypto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * 加密工具类
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Component
public class EncryptUtils {

    private static final String DEFAULT_KEY = "AIPrompt2Draw-AES-Key-32Char";

    @Value("${app.encrypt.key:AIPrompt2Draw-AES-Key-32Char}")
    private String encryptKey;

    /**
     * AES加密
     *
     * @param plaintext 明文
     * @return 加密后的密文
     */
    public String encrypt(String plaintext) {
        try {
            if (plaintext == null || plaintext.isEmpty()) {
                return plaintext;
            }

            // 使用AES加密
            AES aes = new AES(encryptKey.getBytes(StandardCharsets.UTF_8));
            return aes.encryptBase64(plaintext);
        } catch (Exception e) {
            log.error("加密失败", e);
            return plaintext; // 加密失败返回原文本
        }
    }

    /**
     * AES解密
     *
     * @param ciphertext 密文
     * @return 解密后的明文
     */
    public String decrypt(String ciphertext) {
        try {
            if (ciphertext == null || ciphertext.isEmpty()) {
                return ciphertext;
            }

            // 使用AES解密
            AES aes = new AES(encryptKey.getBytes(StandardCharsets.UTF_8));
            return aes.decryptStr(ciphertext);
        } catch (Exception e) {
            log.error("解密失败", e);
            return ciphertext; // 解密失败返回原文本
        }
    }

    /**
     * MD5加密
     *
     * @param text 明文
     * @return MD5哈希值
     */
    public String md5(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return DigestUtil.md5Hex(text);
    }

    /**
     * 生成随机密钥
     *
     * @param length 密钥长度
     * @return 随机密钥
     */
    public String generateRandomKey(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return sb.toString();
    }

    /**
     * 生成API Key
     *
     * @return API Key
     */
    public String generateApiKey() {
        return "akt_" + generateRandomKey(24);
    }
}