/**
 * 展示最终图片上传请求的组合方式
 */

const fs = require('fs');

// 读取配置
const imageUploadConfig = require('./lib/image-upload.ts');

console.log('======================================');
console.log('📤 图片上传请求组合方式');
console.log('======================================');
console.log('');

// 从 .env.local 读取 API Key
const envContent = fs.readFileSync('.env.local', 'utf-8');
const imgurKeyMatch = envContent.match(/IMGUR_API_KEY=(.+)/);
const apiKey = imgurKeyMatch ? imgurKeyMatch[1].trim() : '';

console.log('🔑 配置信息:');
console.log('');
console.log('1️⃣  Provider (提供商):');
console.log('   imgur');
console.log('');
console.log('2️⃣  Base URL (上传地址):');
console.log('   https://www.imgurl.org/api/v3/upload');
console.log('');
console.log('3️⃣  API Key:');
console.log('   ' + apiKey.substring(0, 20) + '...');
console.log('');
console.log('4️⃣  Form Field Name (表单字段名):');
console.log('   file');
console.log('');

console.log('======================================');
console.log('🔧 最终的组合方式');
console.log('======================================');
console.log('');

console.log('📋 完整的 HTTP 请求:');
console.log('');
console.log('POST /api/upload HTTP/1.1');
console.log('Host: localhost:3001');
console.log('');
console.log('Headers (请求头):');
console.log('  x-image-provider: imgur');
console.log('  x-image-api-key: ' + apiKey);
console.log('');
console.log('Body (请求体 - FormData):');
console.log('  file: [二进制图片数据]');
console.log('');

console.log('======================================');
console.log('🔄 Next.js API 转发到图库');
console.log('======================================');
console.log('');

console.log('📋 转发到图库的 HTTP 请求:');
console.log('');
console.log('POST https://www.imgurl.org/api/v3/upload HTTP/1.1');
console.log('');
console.log('Headers (请求头):');
console.log('  Authorization: Client-ID ' + apiKey);
console.log('  Content-Type: multipart/form-data');
console.log('');
console.log('Body (请求体 - FormData):');
console.log('  file: [二进制图片数据]');
console.log('');

console.log('======================================');
console.log('📝 代码逻辑 (lib/image-upload.ts)');
console.log('======================================');
console.log('');

console.log('imgur: {');
console.log('  name: \'Imgur\',');
console.log('  uploadUrl: \'https://www.imgurl.org/api/v3/upload\',');
console.log('  headers: (cfg) => ({');
console.log('    // 🔑 这里将 API Key 组合到 Authorization 头');
console.log('    Authorization: `Client-ID ${cfg.apiKey}`');
console.log('  }),');
console.log('  formFieldName: \'file\',');
console.log('  parseResponse: (data) => {');
console.log('    // 📦 解析图库返回的图片 URL');
console.log('    if (d?.data?.url) return { url: d.data.url };');
console.log('    if (d?.data?.link) return { url: d.data.link };');
console.log('    return null;');
console.log('  }');
console.log('}');
console.log('');

console.log('======================================');
console.log('🔗 请求流程');
console.log('======================================');
console.log('');
console.log('1️⃣  前端 → Next.js API (/api/upload)');
console.log('   Headers:');
console.log('   - x-image-provider: "imgur"');
console.log('   - x-image-api-key: "' + apiKey + '"');
console.log('   Body: FormData { file: <图片> }');
console.log('');
console.log('2️⃣  Next.js API → 图库 API');
console.log('   URL: https://www.imgurl.org/api/v3/upload');
console.log('   Headers:');
console.log('   - Authorization: "Client-ID ' + apiKey + '"');
console.log('   Body: FormData { file: <图片> }');
console.log('');
console.log('3️⃣  图库 API → Next.js API');
console.log('   Response: {');
console.log('     "code": 200,');
console.log('     "data": { "url": "https://..." }');
console.log('   }');
console.log('');
console.log('4️⃣  Next.js API → 前端');
console.log('   Response: {');
console.log('     "success": true,');
console.log('     "data": { "url": "https://..." }');
console.log('   }');
console.log('');

