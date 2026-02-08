#!/bin/bash

API_KEY=$(grep IMGUR_API_KEY .env.local | cut -d'=' -f2)

echo "======================================"
echo "🧪 测试 ImgURL API (修复版)"
echo "======================================"
echo ""
echo "🔑 API Key: ${API_KEY:0:20}..."
echo "🌐 API URL: https://www.imgurl.org/api/v3/upload"
echo ""

# 创建测试图片
cat > /tmp/test.png.base64 << 'IMGEOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==
IMGEOF
base64 -d /tmp/test.png.base64 > /tmp/test.png

echo "📤 使用正确的字段名 'file'..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://www.imgurl.org/api/v3/upload \
  -H "Authorization: Client-ID $API_KEY" \
  -F "file=@/tmp/test.png")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "📊 响应状态码: $HTTP_CODE"
echo ""
echo "📦 响应体:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  IMAGE_URL=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('url') or data.get('data', {}).get('link', 'N/A'))" 2>/dev/null)
  echo "✅ 图片上传成功！"
  echo "🔗 图片URL: $IMAGE_URL"
else
  echo "❌ 图片上传失败"
fi
