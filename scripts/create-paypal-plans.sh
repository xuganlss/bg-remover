#!/bin/bash
# Create PayPal Subscription Plans (Sandbox mode)
# 使用方法：./create-paypal-plans.sh YOUR_SECRET_KEY

CLIENT_ID="AcAPfiyzUv1hoJvvkAnBQJ8mGLOySzXm46KYu3lalmatqbPye-FsxEq1kVt-2YZRUBvhV65UCfdlWRI5"
SECRET="$1"

if [ -z "$SECRET" ]; then
  echo "❌ 使用方法：./create-paypal-plans.sh YOUR_SECRET_KEY"
  echo ""
  echo "获取 Secret Key 的步骤："
  echo "1. 访问 https://developer.paypal.com/dashboard/applications"
  echo "2. 点击你的应用 'bg-remover'"
  echo "3. 点击 Secret key 旁边的 '查看' 图标"
  echo "4. 复制 Secret key 并运行：./create-paypal-plans.sh <secret>"
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
  echo "❌ 获取 Access Token 失败，请检查 Secret Key 是否正确"
  exit 1
fi

echo "✅ Access Token 获取成功"
echo ""

# 先创建产品
echo "📦 创建产品 (Product)..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/catalogs/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "BGRemover Credits",
    "description": "Monthly subscription credits for AI background removal",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }')

PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.id')
echo "✅ 产品创建成功: $PRODUCT_ID"
echo ""

# 创建 Basic Plan
echo "📦 创建 Basic Plan (\$9.99/月，25 积分)..."
BASIC_PLAN_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/billing/plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"product_id\": \"$PRODUCT_ID\",
    \"name\": \"BGRemover Basic Plan\",
    \"description\": \"25 credits per month for AI background removal\",
    \"status\": \"ACTIVE\",
    \"billing_cycles\": [
      {
        \"frequency\": {
          \"interval_unit\": \"MONTH\",
          \"interval_count\": 1
        },
        \"tenure_type\": \"REGULAR\",
        \"sequence\": 1,
        \"total_cycles\": 0,
        \"pricing_scheme\": {
          \"fixed_price\": {
            \"currency_code\": \"USD\",
            \"value\": \"9.99\"
          }
        }
      }
    ],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee\": {
        \"currency_code\": \"USD\",
        \"value\": \"0\"
      },
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    }
  }")

BASIC_PLAN_ID=$(echo "$BASIC_PLAN_RESPONSE" | jq -r '.id')
echo "✅ Basic Plan 创建成功: $BASIC_PLAN_ID"
echo ""

# 创建 Pro Plan
echo "📦 创建 Pro Plan (\$19.99/月，60 积分)..."
PRO_PLAN_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/billing/plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"product_id\": \"$PRODUCT_ID\",
    \"name\": \"BGRemover Pro Plan\",
    \"description\": \"60 credits per month for AI background removal with priority support\",
    \"status\": \"ACTIVE\",
    \"billing_cycles\": [
      {
        \"frequency\": {
          \"interval_unit\": \"MONTH\",
          \"interval_count\": 1
        },
        \"tenure_type\": \"REGULAR\",
        \"sequence\": 1,
        \"total_cycles\": 0,
        \"pricing_scheme\": {
          \"fixed_price\": {
            \"currency_code\": \"USD\",
            \"value\": \"19.99\"
          }
        }
      }
    ],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee\": {
        \"currency_code\": \"USD\",
        \"value\": \"0\"
      },
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    }
  }")

PRO_PLAN_ID=$(echo "$PRO_PLAN_RESPONSE" | jq -r '.id')
echo "✅ Pro Plan 创建成功: $PRO_PLAN_ID"
echo ""

echo "=========================================="
echo "✅ 完成！请复制以下 Plan ID 到你的代码："
echo "=========================================="
echo ""
echo "Basic Plan ID: $BASIC_PLAN_ID"
echo "Pro Plan ID: $PRO_PLAN_ID"
echo ""
echo "然后更新 app/pricing/page.tsx 中的 subscriptionPlans 数组，"
echo "并将 SUBSCRIPTION_ENABLED 设置为 true"
echo ""
