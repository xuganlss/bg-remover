// Create PayPal Subscription Plans (Sandbox mode)
// Run: node scripts/create-paypal-plans.js

const fetch = require('node-fetch');

const CLIENT_ID = 'AcAPfiyzUv1hoJvvkAnBQJ8mGLOySzXm46KYu3lalmatqbPye-FsxEq1kVt-2YZRUBvhV65UCfdlWRI5';
// TODO: 从你的 PayPal Dashboard 获取 Secret Key
// 路径：https://developer.paypal.com/dashboard/applications → 点击你的应用 → 查看 Secret key
const SECRET = 'YOUR_SECRET_KEY_HERE';

const BASE_URL = 'https://api-m.sandbox.paypal.com'; // Sandbox
// const BASE_URL = 'https://api-m.paypal.com'; // Live

async function getAccessToken() {
  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

async function createPlan(token, planConfig) {
  const response = await fetch(`${BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(planConfig),
  });
  
  const data = await response.json();
  return data;
}

async function main() {
  console.log('🔄 Getting access token...\n');
  const token = await getAccessToken();
  console.log('✅ Access token obtained\n');

  // Basic Plan: $9.99/month, 25 credits
  const basicPlan = {
    product_id: 'PROD-XXXXXXXXXXXXXXXXXX', // 需要先创建产品或使用现有产品
    name: 'BGRemover Basic Plan',
    description: '25 credits per month for AI background removal',
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: 'MONTH',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // 0 = 无限循环
        pricing_scheme: {
          fixed_price: {
            currency_code: 'USD',
            value: '9.99',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        currency_code: 'USD',
        value: '0',
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  // Pro Plan: $19.99/month, 60 credits
  const proPlan = {
    product_id: 'PROD-XXXXXXXXXXXXXXXXXX',
    name: 'BGRemover Pro Plan',
    description: '60 credits per month for AI background removal with priority support',
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: 'MONTH',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            currency_code: 'USD',
            value: '19.99',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        currency_code: 'USD',
        value: '0',
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  console.log('📦 Creating Basic Plan ($9.99/month)...\n');
  const basicResult = await createPlan(token, basicPlan);
  console.log('Basic Plan Response:', JSON.stringify(basicResult, null, 2));

  console.log('\n📦 Creating Pro Plan ($19.99/month)...\n');
  const proResult = await createPlan(token, proPlan);
  console.log('Pro Plan Response:', JSON.stringify(proResult, null, 2));

  console.log('\n✅ Done! Copy the plan IDs to your code:');
  console.log(`Basic Plan ID: ${basicResult.id}`);
  console.log(`Pro Plan ID: ${proResult.id}`);
}

main().catch(console.error);
