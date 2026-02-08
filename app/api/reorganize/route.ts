
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

    const systemPrompt = `你是一个智能文档整理助手。你的任务是分析用户提供的文本行，识别每一行中包含的不同语义部分，并提出重组建议。
    
    特别是针对单行文本包含多个信息点的情况（例如：任务描述 + 时间 + 标签 + 负责人），你需要将它们拆解。
    
    请返回 JSON 格式，结构如下：
    {
      "analysis": [
        {
          "originalLine": "原始行文本",
          "segments": [
            { "text": "提取的片段", "type": "类型(如: task, date, tag, person, priority, note)", "confidence": 0.95 }
          ],
          "reorganized": [
             { "content": "重组后的主要内容", "note": "备注/标签等元数据" }
          ],
          "action": "建议的操作 (keep | split | extract_metadata)"
        }
      ]
    }
    
    示例输入: "明天下午3点开会 #工作 @张三"
    示例输出: 
    {
      "analysis": [
        {
          "originalLine": "明天下午3点开会 #工作 @张三",
          "segments": [
            { "text": "开会", "type": "task" },
            { "text": "明天下午3点", "type": "date" },
            { "text": "#工作", "type": "tag" },
            { "text": "@张三", "type": "person" }
          ],
          "reorganized": [
            { "content": "开会", "note": "时间: 明天下午3点, 标签: 工作, 负责人: 张三" }
          ],
          "action": "extract_metadata"
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
