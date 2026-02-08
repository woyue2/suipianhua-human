/**
 * 智谱AI API 测试脚本
 * 用于验证API Key和模型调用
 */

const API_KEY = process.env.ZHIPU_API_KEY || '4b210a44e896495d8217066a32fec2b8.xktiqzDDCQDmuRqR';

async function testZhipuAI() {
  console.log('🧪 Testing ZhipuAI API...\n');

  const model = 'glm-4-flash'; // 先用免费模型测试
  const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: `请将以下内容整理成JSON格式的树状结构：
苹果
香蕉
橙子
Python
JavaScript

返回格式：
{
  "reasoning": "说明",
  "newStructure": {
    "content": "分类名称",
    "children": [
      {"content": "项目", "children": []}
    ]
  }
}`,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }, // 关键：强制JSON格式
  };

  try {
    console.log(`📤 Calling ${model}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log(`📊 Status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Success!');
    console.log('\n📝 Response:');
    console.log(JSON.stringify(data, null, 2));

    const content = data.choices[0].message.content;
    console.log('\n🎯 Parsed Content:');
    console.log(content);

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testZhipuAI();
