import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Firebase Admin 初始化（服务端专用）────────────────────────
function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

// ─── PayPal Webhook 签名验证 ───────────────────────────────────
async function verifyPayPalWebhook(req: NextRequest, body: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const transmissionId = req.headers.get('paypal-transmission-id') ?? '';
  const timestamp = req.headers.get('paypal-transmission-time') ?? '';
  const certUrl = req.headers.get('paypal-cert-url') ?? '';
  const signature = req.headers.get('paypal-transmission-sig') ?? '';
  const authAlgo = req.headers.get('paypal-auth-algo') ?? '';

  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  // 获取 PayPal access token
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await tokenRes.json();

  // 调用 PayPal 验证接口
  const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: signature,
      transmission_time: timestamp,
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

  // 生产环境验签，开发环境跳过
  if (process.env.NODE_ENV === 'production') {
    const valid = await verifyPayPalWebhook(req, body);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  }

  const event = JSON.parse(body);
  const db = getAdminDb();

  try {
    switch (event.event_type) {
      // ── 订阅激活（前端也会调用，这里做兜底）─────────────────
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const sub = event.resource;
        const subscriptionId: string = sub.id;
        const planId: string = sub.plan_id;

        // 从 subscriptions 集合查 uid（前端已写入）
        const subRef = db.doc(`subscriptions/${subscriptionId}`);
        const subSnap = await subRef.get();
        if (!subSnap.exists) break;

        const { uid, plan } = subSnap.data()!;
        await subRef.update({ status: 'active', updatedAt: new Date() });
        await db.doc(`users/${uid}`).update({ subscriptionStatus: 'active', plan });
        break;
      }

      // ── 订阅续费 ──────────────────────────────────────────────
      case 'BILLING.SUBSCRIPTION.RENEWED':
      case 'PAYMENT.SALE.COMPLETED': {
        // PAYMENT.SALE.COMPLETED 在每次扣款成功时触发
        const billing = event.resource;
        const subscriptionId: string =
          billing.billing_agreement_id ?? billing.id;
        if (!subscriptionId) break;

        const subSnap = await db.doc(`subscriptions/${subscriptionId}`).get();
        if (!subSnap.exists) break;
        const { uid, plan } = subSnap.data()!;

        const amount = parseFloat(billing.amount?.total ?? billing.amount?.value ?? '0');
        const monthCredits = plan === 'pro' ? 60 : 25;
        const now = new Date();
        const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // 更新用户积分
        await db.doc(`users/${uid}`).update({
          credits: (await db.doc(`users/${uid}`).get()).data()!.credits + monthCredits,
          subscriptionEnd: end,
          subscriptionStatus: 'active',
        });

        // 更新订阅记录
        await db.doc(`subscriptions/${subscriptionId}`).update({
          currentPeriodStart: now,
          currentPeriodEnd: end,
          status: 'active',
          updatedAt: now,
        });

        // 写续费子集合
        await db.collection(`subscriptions/${subscriptionId}/billingHistory`).add({
          amount,
          currency: 'USD',
          billedAt: now,
          nextBillingAt: end,
          status: 'completed',
        });

        // 写积分流水
        const userSnap = await db.doc(`users/${uid}`).get();
        const balance = userSnap.data()!.credits;
        await db.collection(`creditLedger/${uid}/entries`).add({
          type: 'subscription_reset',
          delta: monthCredits,
          balanceAfter: balance,
          description: `${plan === 'pro' ? 'Pro' : 'Basic'} 订阅续费，重置月度积分`,
          refId: subscriptionId,
          createdAt: now,
        });
        break;
      }

      // ── 订阅取消 ──────────────────────────────────────────────
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const sub = event.resource;
        const subscriptionId: string = sub.id;
        const subSnap = await db.doc(`subscriptions/${subscriptionId}`).get();
        if (!subSnap.exists) break;

        const { uid } = subSnap.data()!;
        const now = new Date();
        const newStatus = event.event_type.includes('CANCELLED') ? 'cancelled' : 'expired';

        await db.doc(`subscriptions/${subscriptionId}`).update({
          status: newStatus,
          cancelledAt: now,
          updatedAt: now,
        });
        await db.doc(`users/${uid}`).update({
          subscriptionStatus: newStatus,
          subscriptionCancelledAt: now,
          plan: 'free',
        });
        break;
      }

      default:
        // 未处理的事件类型，直接 200
        break;
    }
  } catch (err) {
    console.error('[PayPal Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
