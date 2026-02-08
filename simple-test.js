/**
 * 简单直接的图片上传测试
 */

const fs = require('fs');

// ========== 配置 ==========
const BASE_URL = 'https://www.imgurl.org/api/v3/upload';
const API_KEY = 'sk-HGsVzluJdt2EdL3clLYmf8oZcR2s0wB1XRm1y54B51YS8ij10Imidxosq3fJD';

// ========== 拼接 Authorization 头 ==========
const authHeader = `Bearer ${API_KEY}`;

console.log('======================================');
console.log('📤 简单直接的上传测试');
console.log('======================================');
console.log('');
console.log('🔑 配置:');
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`  Authorization: ${authHeader.substring(0, 30)}...`);
console.log('');

// ========== 创建测试图片 ==========
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
const testImageBuffer = Buffer.from(testImageBase64, 'base64');
fs.writeFileSync('/tmp/test.png', testImageBuffer);

// ========== 使用 Node.js fetch 发起请求 ==========
async function uploadImage() {
  console.log('🚀 发起请求...');
  console.log('');

  const formData = new FormData();
  formData.append('file', new Blob([testImageBuffer], { type: 'image/png' }), 'test.png');

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,  // ← 直接使用拼接好的 Authorization
    },
    body: formData,
  });

  console.log(`📊 状态码: ${response.status}`);
  console.log('');

  const data = await response.json();
  console.log('📦 响应数据:');
  console.log(JSON.stringify(data, null, 2));
  console.log('');

  if (data.data?.url || data.data?.link) {
    console.log('✅ 上传成功！');
    console.log('🔗 图片URL:', data.data.url || data.data.link);
  } else {
    console.log('❌ 上传失败');
  }
}

uploadImage();
