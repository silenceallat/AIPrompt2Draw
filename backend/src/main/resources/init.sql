-- AIPrompt2Draw 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `aiprompt2draw` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `aiprompt2draw`;

-- 1. API Key管理表
DROP TABLE IF EXISTS `api_key`;
CREATE TABLE `api_key` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `key_value` VARCHAR(64) NOT NULL UNIQUE COMMENT 'API Key值',
  `key_type` TINYINT NOT NULL DEFAULT 1 COMMENT 'Key类型: 1-试用 2-付费 3-VIP',
  `quota` INT NOT NULL DEFAULT 0 COMMENT '剩余额度(次数)',
  `total_quota` INT NOT NULL DEFAULT 0 COMMENT '总额度',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用 2-已过期',
  `rate_limit` INT NOT NULL DEFAULT 10 COMMENT '每分钟请求限制',
  `expire_time` DATETIME COMMENT '过期时间',
  `remark` VARCHAR(255) COMMENT '备注信息',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_key_value` (`key_value`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API Key管理表';

-- 2. 使用记录表
DROP TABLE IF EXISTS `usage_record`;
CREATE TABLE `usage_record` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `api_key_id` BIGINT NOT NULL COMMENT 'API Key ID',
  `key_value` VARCHAR(64) NOT NULL COMMENT 'API Key值',
  `model_type` VARCHAR(32) NOT NULL COMMENT '使用的模型: openai/claude/wenxin等',
  `model_name` VARCHAR(64) NOT NULL COMMENT '具体模型名称: gpt-4/claude-3-sonnet等',
  `input_text` TEXT COMMENT '用户输入内容',
  `output_xml` MEDIUMTEXT COMMENT '生成的XML内容',
  `prompt_tokens` INT COMMENT '输入Token数',
  `completion_tokens` INT COMMENT '输出Token数',
  `total_tokens` INT COMMENT '总Token数',
  `cost` DECIMAL(10, 6) COMMENT '本次调用成本(元)',
  `response_time` INT COMMENT '响应时间(毫秒)',
  `status` TINYINT NOT NULL COMMENT '状态: 1-成功 0-失败',
  `error_msg` TEXT COMMENT '错误信息',
  `ip_address` VARCHAR(64) COMMENT '请求IP',
  `user_agent` VARCHAR(512) COMMENT '用户代理',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_api_key_id` (`api_key_id`),
  INDEX `idx_key_value` (`key_value`),
  INDEX `idx_model_type` (`model_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API使用记录表';

-- 3. 模型配置表
DROP TABLE IF EXISTS `model_config`;
CREATE TABLE `model_config` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `model_type` VARCHAR(32) NOT NULL UNIQUE COMMENT '模型类型: openai/claude/wenxin等',
  `model_name` VARCHAR(64) NOT NULL COMMENT '模型名称',
  `api_key` VARCHAR(512) NOT NULL COMMENT '厂商API Key(加密存储)',
  `api_url` VARCHAR(255) NOT NULL COMMENT 'API地址',
  `api_secret` VARCHAR(512) COMMENT 'API Secret(部分厂商需要)',
  `max_tokens` INT DEFAULT 2000 COMMENT '最大Token数',
  `temperature` DECIMAL(3, 2) DEFAULT 0.7 COMMENT '温度参数',
  `priority` INT NOT NULL DEFAULT 0 COMMENT '优先级(数字越大优先级越高)',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `cost_per_1k_prompt_tokens` DECIMAL(10, 6) COMMENT '每1K prompt tokens成本(元)',
  `cost_per_1k_completion_tokens` DECIMAL(10, 6) COMMENT '每1K completion tokens成本(元)',
  `remark` VARCHAR(255) COMMENT '备注',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_model_type` (`model_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型配置表';

-- 4. 系统管理员表
DROP TABLE IF EXISTS `admin_user`;
CREATE TABLE `admin_user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `username` VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(128) NOT NULL COMMENT '密码(BCrypt加密)',
  `nickname` VARCHAR(64) COMMENT '昵称',
  `email` VARCHAR(128) COMMENT '邮箱',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `last_login_time` DATETIME COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(64) COMMENT '最后登录IP',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统管理员表';

-- 插入默认管理员账号 (用户名: admin, 密码: admin123)
-- BCrypt加密后的密码
INSERT INTO `admin_user` (`username`, `password`, `nickname`, `email`, `status`)
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', 'admin@aiprompt2draw.com', 1);

-- 插入一个测试用的API Key (akt_test1234567890abcdef)
INSERT INTO `api_key` (`key_value`, `key_type`, `quota`, `total_quota`, `status`, `rate_limit`, `expire_time`, `remark`)
VALUES ('akt_test1234567890abcdef', 1, 10, 10, 1, 10, DATE_ADD(NOW(), INTERVAL 30 DAY), '测试用API Key');

-- 插入OpenAI模型配置示例 (需要替换真实的API Key)
INSERT INTO `model_config` (`model_type`, `model_name`, `api_key`, `api_url`, `max_tokens`, `temperature`, `priority`, `status`, `cost_per_1k_prompt_tokens`, `cost_per_1k_completion_tokens`, `remark`)
VALUES ('openai', 'gpt-4', 'your-openai-api-key-here', 'https://api.openai.com/v1/chat/completions', 2000, 0.7, 10, 0, 0.03, 0.06, 'OpenAI GPT-4模型(需配置真实API Key)');
