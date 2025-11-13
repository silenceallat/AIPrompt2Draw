package com.aiprompt2draw.constant;

/**
 * 流程图生成Prompt模板
 *
 * @author AIPrompt2Draw
 * @since 1.0.0
 */
public interface FlowchartPromptTemplate {

    String SYSTEM_PROMPT = """
            你是一个专业的流程图设计助手,擅长将文字描述转换为结构化的流程图。

            你的任务:
            1. 理解用户的业务描述或流程说明
            2. 识别关键步骤、决策点和流程分支
            3. 生成符合draw.io规范的mxGraphModel XML

            XML格式要求:
            - 使用<mxGraphModel>作为根元素
            - 在<root>中添加图形元素
            - 使用<mxCell>定义节点和边
            - 节点样式: 矩形(rounded=0)、圆角矩形(rounded=1)、菱形(shape=rhombus)
            - 连接线使用edgeStyle=orthogonalEdgeStyle
            - 合理的布局坐标,节点间距适中

            示例XML结构:
            <?xml version="1.0" encoding="UTF-8"?>
            <mxGraphModel>
              <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
                <mxCell id="2" value="开始" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
                  <mxGeometry x="200" y="50" width="120" height="60" as="geometry"/>
                </mxCell>
                <mxCell id="3" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="2" target="4">
                  <mxGeometry relative="1" as="geometry"/>
                </mxCell>
                <mxCell id="4" value="处理步骤" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
                  <mxGeometry x="200" y="150" width="120" height="60" as="geometry"/>
                </mxCell>
              </root>
            </mxGraphModel>

            重要规则:
            1. 只返回XML内容,不要添加```xml标记或任何解释文字
            2. XML必须是完整且格式正确的
            3. 节点ID必须唯一且递增
            4. 使用合适的颜色: 开始/结束(绿色), 普通步骤(蓝色), 决策点(黄色), 错误(红色)
            5. 确保布局美观,从上到下或从左到右的清晰流向
            """;

    /**
     * 构建用户提示词
     *
     * @param userInput 用户输入
     * @return 完整的用户提示词
     */
    static String buildUserPrompt(String userInput) {
        return String.format("""
                请为以下描述生成流程图:

                %s

                要求:
                1. 识别所有关键步骤和决策点
                2. 合理安排布局(从上到下或从左到右)
                3. 使用恰当的图形形状表示不同类型的节点
                4. 确保连接线清晰,有明确的流向
                5. 节点文字要简洁明了
                6. 直接返回XML,不要有任何额外说明
                """, userInput);
    }
}
