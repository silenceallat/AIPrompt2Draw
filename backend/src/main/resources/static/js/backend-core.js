/**
 * AIPrompt2Draw - 后端集成核心功能模块
 * 负责后端API调用、流程图生成、响应解析等核心逻辑
 */

class BackendCoreEngine {
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
            // 检查是否配置了后端API Key
            const backendApiKey = localStorage.getItem('backend_api_key');
            if (!backendApiKey) {
                window.uiManager.addMessage('system', '⚠️ 请先配置后端API Key');
                this.promptForBackendApiKey();
                return;
            }

            // 添加用户消息
            window.uiManager.addMessage('user', message);

            // 显示加载状态
            const loadingId = window.uiManager.addMessage('assistant', '正在生成流程图...', true);

            try {
                // 调用后端API生成流程图
                const result = await this.generateFlowchartViaBackend(message, backendApiKey);

                // 移除加载消息
                window.uiManager.removeMessage(loadingId);

                if (result.success) {
                    // 添加AI回复
                    window.uiManager.addMessage('assistant', result.content);

                    // 如果有XML内容，加载到DrawIO
                    if (result.xmlContent) {
                        if (window.drawioGenerator) {
                            await window.drawioGenerator.loadXmlToDrawio(result.xmlContent);
                        }
                    }
                } else {
                    window.uiManager.addMessage('system', `❌ 生成失败：${result.error}`);
                }

            } catch (error) {
                // 移除加载消息
                window.uiManager.removeMessage(loadingId);

                console.error('后端API调用失败:', error);
                let errorMessage = '生成流程图时发生错误';

                if (error.message.includes('401')) {
                    errorMessage = 'API Key无效或已过期，请检查配置';
                } else if (error.message.includes('403')) {
                    errorMessage = 'API配额不足或权限不够';
                } else if (error.message.includes('429')) {
                    errorMessage = '请求过于频繁，请稍后再试';
                } else if (error.message.includes('500')) {
                    errorMessage = '服务器内部错误，请稍后再试';
                }

                window.uiManager.addMessage('system', `❌ ${errorMessage}`);
            }

        } catch (error) {
            console.error('处理消息发送时发生错误:', error);
            window.uiManager.addMessage('system', '❌ 发生未知错误，请重试');
        }
    }

    // 通过后端API生成流程图
    async generateFlowchartViaBackend(message, apiKey) {
        const response = await fetch('/api/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({
                prompt: message,
                modelType: 'openai'  // 可以根据后端支持的模型调整
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败 (${response.status}): ${errorText}`);
        }

        const result = await response.json();

        if (result.code === 200) {
            // 解析后端返回的响应
            const content = result.data.content || '';
            const xmlContent = this.extractXmlFromResponse(content);

            return {
                success: true,
                content: content,
                xmlContent: xmlContent
            };
        } else {
            return {
                success: false,
                error: result.message || '生成失败'
            };
        }
    }

    // 从响应中提取XML内容
    extractXmlFromResponse(content) {
        // 查找代码块中的XML内容
        const xmlCodeBlockMatch = content.match(/```xml\s*([\s\S]*?)\s*```/);
        if (xmlCodeBlockMatch) {
            return xmlCodeBlockMatch[1].trim();
        }

        // 查找<mxGraphModel>标签
        const xmlMatch = content.match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/);
        if (xmlMatch) {
            return xmlMatch[0];
        }

        return null;
    }

    // 提示用户输入后端API Key
    promptForBackendApiKey() {
        const apiKey = prompt('请输入后端API Key:', localStorage.getItem('backend_api_key') || '');
        if (apiKey) {
            localStorage.setItem('backend_api_key', apiKey);
            window.uiManager.addMessage('system', '✅ API Key已保存，请重新发送消息');
        }
    }

    // 测试后端API连接
    async testBackendConnection(apiKey) {
        try {
            const response = await fetch('/api/v1/quota', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                }
            });

            if (response.ok) {
                const result = await response.json();
                return result.code === 200;
            }
            return false;
        } catch (error) {
            console.error('测试连接失败:', error);
            return false;
        }
    }

    // 查询使用额度
    async queryQuota(apiKey) {
        try {
            const response = await fetch('/api/v1/quota', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.code === 200) {
                    return result.data;
                }
            }
            return null;
        } catch (error) {
            console.error('查询额度失败:', error);
            return null;
        }
    }
}

// 创建全局后端核心引擎实例
const backendCoreEngine = new BackendCoreEngine();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackendCoreEngine, backendCoreEngine };
} else {
    window.BackendCoreEngine = BackendCoreEngine;
    window.backendCoreEngine = backendCoreEngine;
}