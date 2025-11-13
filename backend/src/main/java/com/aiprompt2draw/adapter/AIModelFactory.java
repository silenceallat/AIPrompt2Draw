package com.aiprompt2draw.adapter;

import com.aiprompt2draw.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AI模型适配器工厂
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
@Slf4j
@Component
public class AIModelFactory {

    private final Map<String, AIModelAdapter> adapters = new ConcurrentHashMap<>();

    @Autowired
    public AIModelFactory(List<AIModelAdapter> adapterList) {
        adapterList.forEach(adapter -> {
            adapters.put(adapter.getModelType(), adapter);
            log.info("注册AI模型适配器: {}", adapter.getModelType());
        });
    }

    /**
     * 获取模型适配器
     *
     * @param modelType 模型类型
     * @return 模型适配器
     */
    public AIModelAdapter getAdapter(String modelType) {
        AIModelAdapter adapter = adapters.get(modelType);
        if (adapter == null) {
            throw new BusinessException("不支持的模型类型: " + modelType);
        }
        return adapter;
    }

    /**
     * 获取所有支持的模型类型
     *
     * @return 模型类型列表
     */
    public List<String> getSupportedModelTypes() {
        return List.copyOf(adapters.keySet());
    }
}
