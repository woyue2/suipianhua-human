#!/bin/bash

# 读取 API Key
API_KEY=$(grep IMGUR_API_KEY .env.local | cut -d'=' -f2)

echo "======================================"
echo "📤 测试图片上传 API"
echo "======================================"
echo ""
echo "🔑 API Key: ${API_KEY:0:20}..."
echo "🌐 端点: http://localhost:3001/api/upload"
echo ""

# 创建一个 1x1 像素的红色 PNG 图片
cat > /tmp/test.png.base64 << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==
EOF

base64 -d /tmp/test.png.base64 > /tmp/test.png

echo "📸 测试图片已创建: /tmp/test.png"
echo ""

# 执行上传请求
echo "🚀 发送请求..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/upload \
  -H "x-image-provider: imgur" \
  -H "x-image-api-key: $API_KEY" \
  -F "file=@/tmp/test.png")

# 分离响应体和状态码
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "📊 响应状态码: $HTTP_CODE"
echo ""
echo "📦 响应体:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

# 检查结果
if [ "$HTTP_CODE" = "200" ]; then
  IMAGE_URL=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['url'])" 2>/dev/null)
  if [ -n "$IMAGE_URL" ]; then
    echo "✅ 图片上传成功！"
    echo "🔗 图片URL: $IMAGE_URL"
  else
    echo "⚠️  响应成功但未找到图片URL"
  fi
else
  echo "❌ 图片上传失败"
fi

echo ""
echo "======================================"
