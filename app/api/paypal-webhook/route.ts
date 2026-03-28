import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID!;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL!;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

// ─── 生成 Firebase JWT access token ──────────────────────────
async function getFirebaseToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    sub: FIREBASE_CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // 导入私钥
  const pemBody = FIREBASE_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signingInput}.${sigB64}`;

  // 换取 access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

// ─── Firestore REST 操作 ──────────────────────────────────────
const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function fsGet(path: string, token: string) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fsPatch(path: string, fields: Record<string, unknown>, token: string) {
  const body = { fields: toFirestoreFields(fields) };
  const updateMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
  await fetch(`${BASE}/${path}?${updateMask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function fsCreate(path: string, fields: Record<string, unknown>, token: string) {
  await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(fields) }),
  });
}

// 把普通对象转成 Firestore REST 格式
function toFirestoreFields(obj: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: String(Math.round(v)) };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (v === null) fields[k] = { nullValue: null };
    else if (v instanceof Date) fields[k] = { timestampValue: v.toISOString() };
    else fields[k] = { stringValue: String(v) };
  }
  return fields;
}

function fromFirestoreValue(v: Record<string, unknown>): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue as string);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  return null;
}

function fromFirestoreDoc(doc: { fields?: Record<string, Record<string, unknown>> }): Record<string, unknown> {
  if (!doc?.fields) return {};
  return Object.fromEntries(Object.entries(doc.fields).map(([k, v]) => [k, fromFirestoreValue(v)]));
}

// ─── PayPal Webhook 签名验证 ───────────────────────────────────
async function verifyPayPalWebhook(req: NextRequest, body: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const baseUrl = 'https://api-m.sandbox.paypal.com'; // 上线后改为 api-m.paypal.com

  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await tokenRes.json();

  const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
    body: JSON.stringify({
      auth_algo: req.headers.get('paypal-auth-algo'),
      cert_url: req.headers.get('paypal-cert-url'),
      transmission_id: req.headers.get('paypal-transmission-id'),
      transmission_sig: req.headers.get('paypal-transmission-sig'),
      transmission_time: req.headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });
  const result = await verifyRes.json();
  return result.verification_status === 'SUCCESS';
}

// ─── 主处理器 ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.text();
  const event = JSON.parse(body);

  // 生产环境验签
  if (process.env.NODE_ENV === 'production') {
    const valid = await verifyPayPalWebhook(req, body);
    if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const token = await getFirebaseToken();
    const PLAN_CREDITS: Record<string, number> = { basic: 25, pro: 60 };

    switch (event.event_type) {

      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscriptionId: string = event.resource.id;
        const subDoc = await fsGet(`subscriptions/${subscriptionId}`, token);
        if (!subDoc) break;
        const sub = fromFirestoreDoc(subDoc);
        await fsPatch(`subscriptions/${subscriptionId}`, { status: 'active', updatedAt: new Date() }, token);
        await fsPatch(`users/${sub.uid}`, { subscriptionStatus: 'active', plan: sub.plan }, token);
        break;
      }

      case 'BILLING.SUBSCRIPTION.RENEWED':
      case 'PAYMENT.SALE.COMPLETED': {
        const billing = event.resource;
        const subscriptionId: string = billing.billing_agreement_id ?? billing.id;
        if (!subscriptionId) break;

        const subDoc = await fsGet(`subscriptions/${subscriptionId}`, token);
        if (!subDoc) break;
        const sub = fromFirestoreDoc(subDoc) as { uid: string; plan: string };
        const monthCredits = PLAN_CREDITS[sub.plan] ?? 25;
        const amount = parseFloat(billing.amount?.total ?? billing.amount?.value ?? '0');
        const now = new Date();
        const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // 读当前积分
        const userDoc = await fsGet(`users/${sub.uid}`, token);
        const user = fromFirestoreDoc(userDoc) as { credits: number };
        const newBalance = (user.credits ?? 0) + monthCredits;

        await fsPatch(`users/${sub.uid}`, {
          credits: newBalance,
          subscriptionEnd: end,
          subscriptionStatus: 'active',
        }, token);
        await fsPatch(`subscriptions/${subscriptionId}`, {
          currentPeriodStart: now,
          currentPeriodEnd: end,
          status: 'active',
          updatedAt: now,
        }, token);
        await fsCreate(`subscriptions/${subscriptionId}/billingHistory`, {
          amount, currency: 'USD', billedAt: now, nextBillingAt: end, status: 'completed',
        }, token);
        await fsCreate(`creditLedger/${sub.uid}/entries`, {
          type: 'subscription_reset',
          delta: monthCredits,
          balanceAfter: newBalance,
          description: `${sub.plan === 'pro' ? 'Pro' : 'Basic'} 订阅续费，重置月度积分`,
          refId: subscriptionId,
          createdAt: now,
        }, token);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const subscriptionId: string = event.resource.id;
        const subDoc = await fsGet(`subscriptions/${subscriptionId}`, token);
        if (!subDoc) break;
        const sub = fromFirestoreDoc(subDoc) as { uid: string };
        const newStatus = event.event_type.includes('CANCELLED') ? 'cancelled' : 'expired';
        const now = new Date();
        await fsPatch(`subscriptions/${subscriptionId}`, { status: newStatus, cancelledAt: now, updatedAt: now }, token);
        await fsPatch(`users/${sub.uid}`, { subscriptionStatus: newStatus, subscriptionCancelledAt: now, plan: 'free' }, token);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[PayPal Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
