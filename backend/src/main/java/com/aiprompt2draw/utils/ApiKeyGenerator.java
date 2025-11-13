package com.aiprompt2draw.utils;

import cn.hutool.core.util.RandomUtil;
import com.aiprompt2draw.enums.ApiKeyType;

/**
 * API Key生成器
 * <p>
 * 生成规则:
 * 前缀(2位) + 类型标识(1位) + 下划线 + 随机字符串(21位) = 总共25位
 * <p>
 * 示例: akt_a1b2c3d4e5f6g7h8i9j0k
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
public class ApiKeyGenerator {

    private static final String PREFIX = "ak";
    private static final int RANDOM_LENGTH = 21;

    /**
     * 生成API Key
     *
     * @param keyType Key类型
     * @return API Key字符串
     */
    public static String generate(Integer keyType) {
        ApiKeyType type = ApiKeyType.getByCode(keyType);
        String typeChar = type.getPrefix();

        // 生成21位随机字符串(小写字母+数字)
        String randomPart = RandomUtil.randomString(
                "abcdefghijklmnopqrstuvwxyz0123456789",
                RANDOM_LENGTH
        );

        return PREFIX + typeChar + "_" + randomPart;
    }

    /**
     * 验证API Key格式
     *
     * @param apiKey API Key
     * @return 是否有效
     */
    public static boolean isValidFormat(String apiKey) {
        if (apiKey == null || apiKey.length() != 25) {
            return false;
        }

        // 检查前缀
        if (!apiKey.startsWith(PREFIX)) {
            return false;
        }

        // 检查类型标识
        char typeChar = apiKey.charAt(2);
        if (typeChar != 't' && typeChar != 'p' && typeChar != 'v') {
            return false;
        }

        // 检查下划线
        if (apiKey.charAt(3) != '_') {
            return false;
        }

        // 检查随机部分是否都是小写字母和数字
        String randomPart = apiKey.substring(4);
        return randomPart.matches("[a-z0-9]{21}");
    }
}
