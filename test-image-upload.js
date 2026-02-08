/**
 * 测试图片上传 API
 * 使用 ImgURL 图库
 */

const fs = require('fs');
const path = require('path');

// 创建一个简单的测试图片（1x1 像素的 PNG）
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

async function testImageUpload() {
  const apiUrl = 'http://localhost:3001/api/upload';

  // 从 .env.local 读取 API Key
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const imgurKeyMatch = envContent.match(/IMGUR_API_KEY=(.+)/);

  if (!imgurKeyMatch) {
    console.error('❌ 未找到 IMGUR_API_KEY，请检查 .env.local 文件');
    process.exit(1);
  }

  const apiKey = imgurKeyMatch[1].trim();

  console.log('📤 开始测试图片上传...');
  console.log('🔑 API Key:', apiKey.substring(0, 20) + '...');
  console.log('🌐 API URL:', apiUrl);
  console.log('');

  // 创建 FormData
  const formData = new FormData();
  const blob = new Blob([testImageBuffer], { type: 'image/png' });
  formData.append('file', blob, 'test.png');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-image-provider': 'imgur',
        'x-image-api-key': apiKey,
      },
      body: formData,
    });

    console.log('📊 响应状态:', response.status, response.statusText);
    console.log('');

    const data = await response.json();
    console.log('📦 响应数据:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok && data.data?.url) {
      console.log('✅ 图片上传成功！');
      console.log('🔗 图片URL:', data.data.url);
    } else {
      console.log('❌ 图片上传失败');
      console.log('错误信息:', data.error?.message || '未知错误');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 运行测试
testImageUpload();
