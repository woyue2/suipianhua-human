
import { NextResponse } from 'next/server';

// Fallback key from test-zhipu.js (for testing purposes)
const DEMO_KEY = '4b210a44e896495d8217066a32fec2b8.xktiqzDDCQDmuRqR';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ZHIPU_API_KEY || DEMO_KEY;
    const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

    const systemPrompt = `你是一个智能文档整理助手。用户的输入通常是碎片化的信息，可能包含笔记、想法、链接、任务、代码片段等多种混合内容。
    
    你的核心任务是：
    1. **语义分段**：识别并分离行内不同的语义单元（Semantic Segments）。不要强行分类，而是根据内容本身识别其性质。
    2. **信息提取**：如果片段具有明确的元数据特征（如标签、时间、URL、特定标识符），请提取出来。
    3. **重组建议**：将核心内容与辅助信息分离，使结构更清晰。

    请返回 JSON 格式，结构如下：
    {
      "analysis": [
        {
          "originalLine": "原始行文本",
          "segments": [
            { 
              "text": "提取的片段内容", 
              "type": "类型推断 (如: content, note, url, tag, time, code, unknown)", 
              "meaning": "简短说明该片段的作用 (可选)"
            }
          ],
          "reorganized": [
             { 
               "content": "核心内容 (去除元数据后的主要文本)", 
               "attributes": { "key": "value" } // 提取出的属性，如 date, urgency, link 等
             }
          ],
          "action": "建议操作 (keep | split | extract_attributes)"
        }
      ]
    }
    
    示例输入: "React Hook 学习 https://react.dev 重点看 useEffect #前端"
    示例输出: 
    {
      "analysis": [
        {
          "originalLine": "React Hook 学习 https://react.dev 重点看 useEffect #前端",
          "segments": [
            { "text": "React Hook 学习", "type": "content" },
            { "text": "https://react.dev", "type": "url" },
            { "text": "重点看 useEffect", "type": "note" },
            { "text": "#前端", "type": "tag" }
          ],
          "reorganized": [
            { 
              "content": "React Hook 学习", 
              "attributes": { 
                "link": "https://react.dev", 
                "note": "重点看 useEffect",
                "tag": "前端"
              } 
            }
          ],
          "action": "extract_attributes"
        }
      ]
    }`;

    const payload = {
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    };

    console.log('🤖 Calling AI with content length:', content.length);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      return NextResponse.json(
        { error: `AI Provider Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const resultDetails = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(resultDetails);

  } catch (error) {
    console.error('Internal Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
