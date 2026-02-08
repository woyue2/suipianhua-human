# 📤 图片上传请求组合方式

## 📍 当前配置 (lib/image-upload.ts)

### Imgur 图床配置

```typescript
imgur: {
  name: 'Imgur',
  uploadUrl: 'https://www.imgurl.org/api/v3/upload',  // ← Base URL
  headers: (cfg) => ({ 
    Authorization: `Client-ID ${cfg.apiKey}`          // ← API Key 组合方式
  }),
  formFieldName: 'file',                              // ← 表单字段名
  parseResponse: (data) => {
    if (d?.data?.url) return { url: d.data.url };
    if (d?.data?.link) return { url: d.data.link };
    return null;
  },
}
```

---

## 🔗 完整请求流程

### 第1步：前端 → Next.js API

```http
POST http://localhost:3001/api/upload HTTP/1.1

Headers:
  x-image-provider: imgur
  x-image-api-key: sk-HGsVzluJdt2EdL3clLYmf8oZcR2s0wB1XRm1y54B51YS8ij10Imidxosq3fJD

Body (multipart/form-data):
  file: [二进制图片数据]
```

### 第2步：Next.js API → 图库API

**最终发出去的请求：**

```http
POST https://www.imgurl.org/api/v3/upload HTTP/1.1

Headers:
  Authorization: Client-ID sk-HGsVzluJdt2EdL3clLYmf8oZcR2s0wB1XRm1y54B51YS8ij10Imidxosq3fJD
  Content-Type: multipart/form-data

Body (multipart/form-data):
  file: [二进制图片数据]
```

### 关键点：Base URL + API Key 组合

```typescript
// 在 app/api/upload/route.ts 中：

// 1. 获取配置
const uploadUrl = 'https://www.imgurl.org/api/v3/upload';  // ← Base URL
const authHeader = `Client-ID ${cfg.apiKey}`;              // ← API Key 组合

// 2. 发送请求
fetch(uploadUrl, {
  method: 'POST',
  headers: {
    Authorization: authHeader,  // ← "Client-ID sk-HGsVzlu..."
  },
  body: formData,
});
```

---

## 🎯 不同图床的对比

### Imgur (当前配置)
- **Base URL**: `https://www.imgurl.org/api/v3/upload`
- **Auth 格式**: `Client-ID ${apiKey}`
- **字段名**: `file`

### SM.MS
- **Base URL**: `https://sm.ms/api/v2/upload`
- **Auth 格式**: `${apiKey}` (直接是token)
- **字段名**: `smfile`

### 自定义图床
- **Base URL**: 从请求头 `x-image-custom-url` 动态获取
- **Auth 格式**: `X-API-Key: ${apiKey}`
- **字段名**: `file`

---

## 🧪 测试命令

```bash
# 直接测试图库 API（绕过 Next.js）
curl -X POST https://www.imgurl.org/api/v3/upload \
  -H "Authorization: Client-ID YOUR_API_KEY" \
  -F "file=@/path/to/image.png"

# 通过 Next.js API 测试
curl -X POST http://localhost:3001/api/upload \
  -H "x-image-provider: imgur" \
  -H "x-image-api-key: YOUR_API_KEY" \
  -F "file=@/path/to/image.png"
```

---

## ❌ 当前问题

图库返回：`"invalid.token"`

**原因**：API Key 格式不正确

- 当前 Key: `sk-HGsVzluJdt2EdL3cl...` (看起来像 OpenAI 格式)
- ImgURL 需要的格式: 较短的 token 字符串

**解决**：需要从 ImgURL 官网获取正确的 API Token
