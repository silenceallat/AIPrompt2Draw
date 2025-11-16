/**
 * AIPrompt2Draw - 核心功能模块
 * 负责API调用、Prompt处理、响应解析等核心逻辑
 */

class CoreEngine {
    constructor() {
        this.systemPrompt = `你是一个专业的流程图生成助手。用户会描述他们想要的流程图，你需要生成符合draw.io格式的XML代码。

重要规则：
1. 必须生成完整的draw.io XML格式，包含 <mxGraphModel> 根元素
2. 使用标准的draw.io形状，如矩形(whiteSpace=wrap)、菱形(rhombus)、圆角矩形(rounded=1)等
3. 合理安排节点位置，使用x、y、width、height属性
4. 使用箭头连接节点，style中包含edgeStyle、rounded等属性
5. 确保所有ID唯一
6. 回复时先简要说明流程图内容，然后在代码块中提供完整的XML

XML基本结构示例：
\`\`\`xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="开始" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="340" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
\`\`\`

请根据用户的描述生成相应的流程图XML。`;

        // 绑定UI消息发送事件
        if (window.uiManager) {
            window.uiManager.onSendMessage = this.handleMessageSend.bind(this);
        }
    }

    // 处理消息发送
    async handleMessageSend(message) {
        try {
            const config = window.configManager.getConfig();
            const apiKey = config.apiKeys[config.provider];

            if (!apiKey) {
                window.uiManager.addMessage('system', `⚠️ 请先为 [${config.provider}] 配置API Key`);
                return;
            }

            if (config.stream) {
                await this.callAPIStreaming(message, apiKey);
            } else {
                const response = await this.callAPI(message, apiKey);
                const xmlId = window.uiManager.addMessage('assistant', response.content, response.xml, response.usage);
                if (xmlId) {
                    window.drawioGenerator.loadXML(xmlId);
                }
            }
        } catch (error) {
            console.error('API调用失败:', error);
            window.uiManager.addMessage('system', '❌ 错误：' + error.message);
        } finally {
            window.uiManager.setSendButtonState(false);
        }
    }

    // 构建认证头
    buildAuthHeader(apiKey, authScheme) {
        return authScheme === 'Direct' ? apiKey : `Bearer ${apiKey}`;
    }

    // 构建发送消息体
    buildMessages(userMessage, includeHistory) {
        const messages = [{ role: 'system', content: this.systemPrompt }];

        if (includeHistory) {
            const history = window.uiManager ? window.uiManager.conversationHistory : [];
            messages.push(...history);
        } else {
            messages.push({ role: 'user', content: userMessage });
        }

        return messages;
    }

    // API调用（非流式）
    async callAPI(userMessage, apiKey) {
        const config = window.configManager.getConfig();
        const authHeader = this.buildAuthHeader(apiKey, config.authScheme);
        const messages = this.buildMessages(userMessage, config.sendHistory);

        const requestBody = {
            model: config.model,
            messages: messages,
            temperature: 0.7,
            stream: false
        };

        try {
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            const usage = data.usage;

            // 更新对话历史
            if (window.uiManager) {
                window.uiManager.conversationHistory.push({ role: 'assistant', content: assistantMessage });
            }

            // 提取XML
            const xml = window.drawioGenerator ? window.drawioGenerator.extractXML(assistantMessage) : null;

            // 清理内容
            const cleanedContent = assistantMessage.replace(/```xml\n[\s\S]*?```/, '').trim();

            return {
                content: cleanedContent,
                xml: xml,
                usage: usage
            };
        } catch (error) {
            console.error('API调用错误:', error);
            throw error;
        }
    }

    // 流式API调用
    async callAPIStreaming(userMessage, apiKey) {
        const config = window.configManager.getConfig();
        const authHeader = this.buildAuthHeader(apiKey, config.authScheme);
        const messages = this.buildMessages(userMessage, config.sendHistory);

        const requestBody = {
            model: config.model,
            messages: messages,
            temperature: 0.7,
            stream: true
        };

        try {
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
                throw new Error(errorMessage);
            }

            await this.processStreamingResponse(response);
        } catch (error) {
            console.error('流式API调用错误:', error);
            throw error;
        }
    }

    // 处理流式响应
    async processStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let finalUsage = null;

        const messageId = 'msg_' + Date.now();
        window.uiManager.addStreamingMessage(messageId);

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const content = json.choices[0]?.delta?.content || '';
                            if (content) {
                                fullContent += content;
                                window.uiManager.updateStreamingMessage(messageId, fullContent);
                            }
                            if (json.usage) {
                                finalUsage = json.usage;
                            }
                        } catch (e) {
                            console.error('解析SSE数据错误:', e);
                        }
                    }
                }
            }

            // 更新对话历史
            if (window.uiManager) {
                window.uiManager.conversationHistory.push({ role: 'assistant', content: fullContent });
            }

            // 提取XML并添加操作按钮
            if (window.drawioGenerator) {
                const xml = window.drawioGenerator.extractXML(fullContent);
                if (xml) {
                    window.uiManager.addLoadButton(messageId, xml, finalUsage);
                }
            }

        } catch (error) {
            console.error('处理流式响应错误:', error);
            throw error;
        }
    }

    // 测试API连接
    async testConnection(provider, apiKey, apiUrl, model) {
        try {
            const authHeader = this.buildAuthHeader(apiKey, window.providerPresets[provider].authScheme);

            const testMessages = [
                { role: 'system', content: '你是一个测试助手。' },
                { role: 'user', content: '请回复"连接成功"' }
            ];

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: testMessages,
                    temperature: 0.1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.error?.message || `HTTP ${response.status}`
                };
            }

            const data = await response.json();
            return {
                success: true,
                response: data.choices[0]?.message?.content || '测试成功'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取模型列表
    async getModels(provider, apiKey, apiUrl) {
        try {
            // 注意：不是所有API都支持获取模型列表
            // 这里提供一个基本的实现，实际使用时可能需要根据具体API调整

            if (provider === 'custom') {
                return { success: true, models: [] };
            }

            // 对于已知的服务商，直接返回预设的模型列表
            const preset = window.providerPresets[provider];
            if (preset && preset.models.length > 0) {
                return { success: true, models: preset.models };
            }

            // 对于未知服务商，尝试获取模型列表
            const authHeader = this.buildAuthHeader(apiKey, preset?.authScheme || 'Bearer');
            const modelsUrl = apiUrl.replace('/chat/completions', '/models');

            const response = await fetch(modelsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': authHeader
                }
            });

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            const data = await response.json();
            const models = data.data?.map(item => item.id) || [];

            return { success: true, models };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 验证XML内容
    validateXML(xml) {
        if (!xml || typeof xml !== 'string') {
            return { valid: false, error: 'XML内容为空' };
        }

        if (window.drawioGenerator) {
            return window.drawioGenerator.validateXML(xml);
        }

        // 基本验证
        const hasRoot = xml.includes('<mxGraphModel>') && xml.includes('</mxGraphModel>');
        const hasRootElement = xml.includes('<root>') && xml.includes('</root>');

        return {
            valid: hasRoot && hasRootElement,
            error: !hasRoot ? '缺少mxGraphModel根元素' : !hasRootElement ? '缺少root元素' : ''
        };
    }

    // 生成错误处理消息
    generateErrorMessage(error, context) {
        let message = '❌ 发生错误';

        if (error.message) {
            message += `：${error.message}`;
        }

        // 根据错误类型提供建议
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            message += '\n💡 建议：请检查API Key是否正确';
        } else if (error.message.includes('429') || error.message.includes('rate')) {
            message += '\n💡 建议：API调用频率过高，请稍后重试';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            message += '\n💡 建议：请检查网络连接';
        } else if (error.message.includes('model')) {
            message += '\n💡 建议：请检查模型名称是否正确';
        }

        return message;
    }
}

// 全局核心引擎实例
const coreEngine = new CoreEngine();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoreEngine, coreEngine };
} else {
    window.CoreEngine = CoreEngine;
    window.coreEngine = coreEngine;
}