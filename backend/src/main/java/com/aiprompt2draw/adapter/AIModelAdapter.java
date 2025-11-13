package com.aiprompt2draw.adapter;

import com.aiprompt2draw.dto.AIResponse;
import com.aiprompt2draw.entity.ModelConfig;

/**
 * AI模型适配器接口
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
public interface AIModelAdapter {

    /**
     * 生成流程图XML
     *
     * @param prompt 用户输入
     * @param config 模型配置
     * @return AI响应结果
     */
    AIResponse generateFlowchart(String prompt, ModelConfig config);

    /**
     * 获取模型类型
     *
     * @return 模型类型标识
     */
    String getModelType();
}
