#!/bin/bash
# Check PayPal Subscription Plans status
# 使用方法：./check-paypal-plans.sh YOUR_SECRET_KEY

CLIENT_ID="AcAPfiyzUv1hoJvvkAnBQJ8mGLOySzXm46KYu3lalmatqbPye-FsxEq1kVt-2YZRUBvhV65UCfdlWRI5"
SECRET="$1"

if [ -z "$SECRET" ]; then
  echo "❌ 使用方法：./check-paypal-plans.sh YOUR_SECRET_KEY"
  echo ""
  echo "获取 Secret Key："
  echo "1. 访问 https://developer.paypal.com/dashboard/applications"
  echo "2. 点击你的应用 'bg-remover'"
  echo "3. 点击 Secret key 旁边的眼睛图标查看"
  exit 1
fi

BASE_URL="https://api-m.sandbox.paypal.com"

echo "🔄 获取 Access Token..."
ACCESS_TOKEN=$(curl -s -X POST "$BASE_URL/v1/oauth2/token" \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "$CLIENT_ID:$SECRET" \
  -d "grant_type=client_credentials" | jq -r '.access_token')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
  echo "❌ 获取 Access Token 失败"
  exit 1
fi

echo "✅ Access Token 获取成功"
echo ""

# 检查 Basic Plan
echo "📋 检查 Basic Plan (P-2U716130Y42076319NHFBYXY)..."
BASIC_RESPONSE=$(curl -s -X GET "$BASE_URL/v1/billing/plans/P-2U716130Y42076319NHFBYXY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Basic Plan 响应:"
echo "$BASIC_RESPONSE" | jq '.'
echo ""

# 检查 Pro Plan
echo "📋 检查 Pro Plan (P-4JS6205PU1505010NHFB2CY)..."
PRO_RESPONSE=$(curl -s -X GET "$BASE_URL/v1/billing/plans/P-4JS6205PU1505010NHFB2CY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Pro Plan 响应:"
echo "$PRO_RESPONSE" | jq '.'
echo ""

# 列出所有计划
echo "📋 列出所有订阅计划..."
ALL_PLANS=$(curl -s -X GET "$BASE_URL/v1/billing/plans?page_size=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "所有计划:"
echo "$ALL_PLANS" | jq '.plans[] | {id: .id, name: .name, status: .status, price: .billing_cycles[0].pricing_scheme.fixed_price.value}'
echo ""
