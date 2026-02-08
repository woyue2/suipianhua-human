#!/bin/bash

API_KEY=$(grep IMGUR_API_KEY .env.local | cut -d'=' -f2)

echo "======================================"
echo "🔍 调试模式 - 图片上传 API"
echo "======================================"
echo ""

# 创建测试图片
cat > /tmp/test.png.base64 << 'IMGEOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==
IMGEOF
base64 -d /tmp/test.png.base64 > /tmp/test.png

echo "📋 发送的请求头："
echo "  x-image-provider: imgur"
echo "  x-image-api-key: ${API_KEY:0:20}..."
echo ""

echo "📤 发送请求..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -v -X POST http://localhost:3001/api/upload \
  -H "x-image-provider: imgur" \
  -H "x-image-api-key: $API_KEY" \
  -F "file=@/tmp/test.png" 2>&1)

# 显示完整响应用于调试
echo "$RESPONSE"
