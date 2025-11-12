/**
 * AIPrompt2Draw - DrawIO生成器模块
 * 负责DrawIO XML的生成、加载和管理
 */

class DrawIOGenerator {
    constructor() {
        this.drawioReady = false;
        this.drawioFrame = null;
        this.initFrame();
    }

    // 初始化DrawIO iframe
    initFrame() {
        this.drawioFrame = document.getElementById('drawioFrame');
        if (!this.drawioFrame) {
            console.error('DrawIO iframe not found');
            return;
        }

        console.log('🚀 初始化DrawIO iframe...');

        // 监听DrawIO消息
        window.addEventListener('message', this.handleDrawioMessage.bind(this));

        // 等待iframe加载完成
        this.drawioFrame.addEventListener('load', () => {
            console.log('📥 DrawIO iframe加载完成');
        });

        // 设置超时检查
        setTimeout(() => {
            if (!this.drawioReady) {
                console.warn('⚠️ Draw.io初始化超时，但这可能是正常的。用户仍可以使用复制功能。');
                // 不要隐藏占位符，让用户知道DrawIO正在加载
            }
        }, 10000);
    }

    // 处理DrawIO消息
    handleDrawioMessage(evt) {
        // 先记录所有消息用于调试
        if (evt.data) {
            console.log('📨 原始消息:', {
                origin: evt.origin,
                data: evt.data,
                dataType: typeof evt.data,
                dataLength: evt.data.length
            });
        }

        if (!evt.data || typeof evt.data !== 'string' || evt.data.length === 0) {
            console.log('⚠️ 跳过空消息');
            return;
        }

        // 只处理来自draw.io域的消息
        if (evt.origin && !evt.origin.includes('diagrams.net') && !evt.origin.includes('jgraph')) {
            console.log('⚠️ 跳过非draw.io域消息:', evt.origin);
            return;
        }

        try {
            const msg = JSON.parse(evt.data);
            console.log('📨 解析后的draw.io消息:', msg);

            switch (msg.event) {
                case 'init':
                    console.log('✅ draw.io初始化完成');
                    this.configureDrawio();
                    // 延迟隐藏占位符，确保DrawIO完全加载
                    setTimeout(() => this.hidePlaceholder(), 1000);
                    break;
                case 'configure':
                    console.log('✅ draw.io配置完成');
                    this.hidePlaceholder();
                    this.drawioReady = true;
                    break;
                case 'load':
                    console.log('✅ XML加载完成');
                    // XML加载成功后立即隐藏占位符
                    this.hidePlaceholder();
                    break;
                case 'xml':
                    console.log('📄 XML响应:', msg);
                    this.hidePlaceholder();
                    break;
                case 'export':
                    console.log('📤 导出响应:', msg);
                    break;
                case 'error':
                    console.error('❌ DrawIO错误:', msg);
                    break;
                default:
                    console.log('❓ 未知消息类型:', msg.event, msg);
            }
        } catch (e) {
            console.error('❌ 解析消息失败:', e);
            console.debug('⚠️ 非JSON消息内容:', evt.data.substring(0, 200));
        }
    }

    // 配置DrawIO
    configureDrawio() {
        if (!this.drawioFrame || !this.drawioFrame.contentWindow) return;

        const configMsg = {
            action: 'configure',
            config: {
                defaultLibraries: 'general;uml;er;bpmn;flowchart;basic;arrows2'
            }
        };

        this.drawioFrame.contentWindow.postMessage(JSON.stringify(configMsg), '*');
        this.drawioReady = true;
    }

    // 隐藏占位符
    hidePlaceholder() {
        const placeholder = document.getElementById('drawioPlaceholder');
        if (placeholder) {
            if (placeholder.style.display !== 'none') {
                placeholder.style.display = 'none';
                console.log('👻 占位符已隐藏');
            } else {
                console.log('ℹ️ 占位符已经隐藏');
            }
        } else {
            console.warn('⚠️ 占位符元素未找到');
        }
    }

    // 加载XML到DrawIO
    loadXML(xml, autoSave = true) {
        if (!xml || typeof xml !== 'string') {
            console.error('❌ XML内容无效:', { xml, type: typeof xml });
            throw new Error('XML内容无效');
        }

        const cleanXml = xml.trim();
        console.log('📄 准备加载XML:', cleanXml.substring(0, 100) + '...');

        // 检查iframe是否存在
        if (!this.drawioFrame) {
            console.error('❌ DrawIO iframe不存在');
            throw new Error('DrawIO编辑器未找到');
        }

        if (!this.drawioReady) {
            console.warn('⚠️ DrawIO编辑器尚未准备好，将延迟加载...');
            setTimeout(() => {
                this.loadXML(xml, autoSave);
            }, 2000);
            return false;
        }

        try {
            // 验证XML格式
            const validation = this.validateXML(cleanXml);
            if (!validation.valid) {
                console.error('❌ XML验证失败:', validation.error);
                throw new Error('XML格式错误: ' + validation.error);
            }

            const message = {
                action: 'load',
                xml: cleanXml,
                autosave: autoSave ? 1 : 0
            };

            console.log('📤 正在发送消息到DrawIO...');
            console.log('📋 消息内容:', JSON.stringify(message, null, 2));

            this.drawioFrame.contentWindow.postMessage(JSON.stringify(message), '*');

            // 立即隐藏占位符，然后延迟显示加载提示
            this.hidePlaceholder();

            setTimeout(() => {
                console.log('✅ XML发送成功，等待DrawIO处理...');
            }, 100);

            return true;
        } catch (error) {
            console.error('❌ 加载失败:', error);
            throw new Error('自动加载失败: ' + error.message);
        }
    }

    // 提取XML代码
    extractXML(content) {
        // 尝试多种XML代码块格式
        const patterns = [
            /```xml\n([\s\S]*?)```/,
            /```\n([\s\S]*?<mxGraphModel[\s\S]*?<\/mxGraphModel>[\s\S]*?)```/,
            /<mxGraphModel[\s\S]*?<\/mxGraphModel>/
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return null;
    }

    // 验证XML格式
    validateXML(xml) {
        if (!xml || typeof xml !== 'string') {
            return { valid: false, error: 'XML内容为空' };
        }

        console.log('🔍 验证XML格式，长度:', xml.length);

        // 检查基本结构
        if (!xml.includes('<mxGraphModel>') || !xml.includes('</mxGraphModel>')) {
            console.log('❌ 缺少mxGraphModel根元素');
            return { valid: false, error: '缺少mxGraphModel根元素' };
        }

        // 检查root元素
        if (!xml.includes('<root>') || !xml.includes('</root>')) {
            console.log('❌ 缺少root元素');
            return { valid: false, error: '缺少root元素' };
        }

        // 检查必要的mxCell元素
        if (!xml.includes('<mxCell')) {
            console.log('❌ 缺少mxCell元素');
            return { valid: false, error: '缺少mxCell元素' };
        }

        console.log('✅ XML格式验证通过');
        return { valid: true };
    }

    // 获取当前DrawIO状态
    getStatus() {
        return {
            ready: this.drawioReady,
            frameExists: !!this.drawioFrame,
            frameWindow: !!(this.drawioFrame && this.drawioFrame.contentWindow)
        };
    }

    // 重新初始化DrawIO
    reinitialize() {
        this.drawioReady = false;

        // 重新加载iframe
        if (this.drawioFrame) {
            this.drawioFrame.src = this.drawioFrame.src;
        }
    }

    // 生成示例XML
    generateExampleXML(type = 'flowchart') {
        const examples = {
            flowchart: `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="开始" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="340" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="处理步骤" style="whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="340" y="140" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="4" value="结束" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
      <mxGeometry x="340" y="240" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="5" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="400" y="100" as="sourcePoint"/>
        <mxPoint x="400" y="140" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
    <mxCell id="6" edge="1" parent="1" source="3" target="4">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="400" y="200" as="sourcePoint"/>
        <mxPoint x="400" y="240" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
  </root>
</mxGraphModel>`,
            simple: `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="测试" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1"><mxGeometry x="100" y="100" width="80" height="40" as="geometry"/></mxCell></root></mxGraphModel>`,
            decision: `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="开始" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="340" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="条件判断" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="320" y="140" width="160" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="4" value="是" style="whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="240" y="280" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="5" value="否" style="whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
      <mxGeometry x="440" y="280" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="6" value="结束" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" vertex="1" parent="1">
      <mxGeometry x="340" y="400" width="120" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`
        };

        return examples[type] || examples.flowchart;
    }

    // 强制加载XML（忽略ready状态）
    forceLoadXML(xml) {
        console.log('🔧 强制加载XML...');

        if (!xml || typeof xml !== 'string') {
            console.error('❌ XML内容无效');
            throw new Error('XML内容无效');
        }

        const cleanXml = xml.trim();
        console.log('📄 强制加载XML内容:', cleanXml.substring(0, 100) + '...');

        if (!this.drawioFrame || !this.drawioFrame.contentWindow) {
            console.error('❌ DrawIO iframe不可用');
            throw new Error('DrawIO编辑器不可用');
        }

        const message = {
            action: 'load',
            xml: cleanXml,
            autosave: 1
        };

        console.log('📤 发送强制加载消息');
        console.log('📋 消息内容:', JSON.stringify(message, null, 2));

        // 强制加载时也立即隐藏占位符
        this.hidePlaceholder();

        this.drawioFrame.contentWindow.postMessage(JSON.stringify(message), '*');

        console.log('✅ 强制加载消息已发送');
        return true;
    }

    // 格式化XML
    formatXML(xml) {
        if (!xml) return '';

        try {
            // 基本的XML格式化
            let formatted = xml.replace(/></g, '>\n<');

            // 移除多余的空行
            formatted = formatted.replace(/\n\s*\n/g, '\n');

            // 添加适当的缩进
            const lines = formatted.split('\n');
            let indent = 0;
            const result = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';

                if (trimmed.startsWith('</')) {
                    indent--;
                }

                const indentedLine = '  '.repeat(Math.max(0, indent)) + trimmed;

                if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
                    indent++;
                }

                return indentedLine;
            });

            return result.join('\n');
        } catch (e) {
            return xml; // 格式化失败，返回原始XML
        }
    }
}

// 全局实例
const drawioGenerator = new DrawIOGenerator();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DrawIOGenerator, drawioGenerator };
} else {
    window.DrawIOGenerator = DrawIOGenerator;
    window.drawioGenerator = drawioGenerator;
}