import {
  doc, getDoc, setDoc, updateDoc, increment,
  serverTimestamp, collection, addDoc, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type Plan = 'free' | 'basic' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type LedgerType = 'purchase' | 'consume' | 'subscription_reset' | 'signup_bonus';

export interface UserRecord {
  email: string;
  name: string;
  picture: string;
  plan: Plan;
  credits: number;
  usageCount: number;
  createdAt: unknown;
  lastUsedAt: unknown;
  // 订阅字段（订阅用户才有）
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: 'basic' | 'pro';
  subscriptionStart?: unknown;
  subscriptionEnd?: unknown;
  subscriptionCancelledAt?: unknown;
}

export interface CreditOrder {
  uid: string;
  email: string;
  amount: number;
  credits: number;
  packName: string;
  paypalOrderId: string;
  status: 'completed' | 'failed';
  createdAt: unknown;
}

export interface SubscriptionRecord {
  uid: string;
  email: string;
  plan: 'basic' | 'pro';
  status: SubscriptionStatus;
  paypalSubscriptionId: string;
  planId: string;
  currentPeriodStart: unknown;
  currentPeriodEnd: unknown;
  cancelledAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface LedgerEntry {
  type: LedgerType;
  delta: number;
  balanceAfter: number;
  description: string;
  refId: string;
  createdAt: unknown;
}

// ─── 月度积分配置 ────────────────────────────────────────────
export const PLAN_MONTHLY_CREDITS: Record<'basic' | 'pro', number> = {
  basic: 25,
  pro: 60,
};

const FREE_SIGNUP_CREDITS = 3;

// ─── 用户初始化 ───────────────────────────────────────────────
export async function ensureUser(uid: string, profile: { email: string; name: string; picture: string }) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      plan: 'free',
      credits: FREE_SIGNUP_CREDITS,
      usageCount: 0,
      createdAt: serverTimestamp(),
      lastUsedAt: serverTimestamp(),
    });
    // 注册赠送积分流水
    await addLedgerEntry(uid, {
      type: 'signup_bonus',
      delta: FREE_SIGNUP_CREDITS,
      balanceAfter: FREE_SIGNUP_CREDITS,
      description: '注册赠送积分',
      refId: uid,
    });
  } else {
    const data = snap.data();
    if (data.credits === undefined) {
      await updateDoc(ref, { credits: FREE_SIGNUP_CREDITS, plan: 'free' });
    }
  }
}

// ─── 积分检查 ─────────────────────────────────────────────────
export async function checkCredits(uid: string): Promise<{ ok: boolean; credits: number; plan: Plan }> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, credits: 0, plan: 'free' };
  const data = snap.data() as UserRecord;
  return { ok: data.credits > 0, credits: data.credits, plan: data.plan };
}

// ─── 消费积分 ─────────────────────────────────────────────────
export async function consumeCredit(uid: string) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    credits: increment(-1),
    usageCount: increment(1),
    lastUsedAt: serverTimestamp(),
  });
  // 写流水（balanceAfter 需重新读，简单起见用 -1 近似；生产可用事务）
  const snap = await getDoc(ref);
  const balance = snap.exists() ? (snap.data().credits as number) : 0;
  await addLedgerEntry(uid, {
    type: 'consume',
    delta: -1,
    balanceAfter: balance,
    description: '抠图使用',
    refId: '',
  });
}

// ─── 用户信息 ─────────────────────────────────────────────────
export async function getUser(uid: string): Promise<UserRecord | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserRecord) : null;
}

// ─── 积分购买记录 ─────────────────────────────────────────────
export async function recordCreditOrder(order: Omit<CreditOrder, 'createdAt'>) {
  await setDoc(doc(db, 'creditOrders', order.paypalOrderId), {
    ...order,
    createdAt: serverTimestamp(),
  });
}

// ─── 购买积分后更新用户 + 写流水 ─────────────────────────────
export async function applyPurchasedCredits(
  uid: string,
  credits: number,
  orderId: string,
  packName: string,
  amount: number,
  email: string,
) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { credits: increment(credits) });

  // 写购买记录
  await recordCreditOrder({
    uid, email, amount, credits, packName,
    paypalOrderId: orderId,
    status: 'completed',
  });

  // 写流水
  const snap = await getDoc(ref);
  const balance = snap.exists() ? (snap.data().credits as number) : credits;
  await addLedgerEntry(uid, {
    type: 'purchase',
    delta: credits,
    balanceAfter: balance,
    description: `��买 ${packName}（${credits} 积分）`,
    refId: orderId,
  });
}

// ─── 激活订阅 ─────────────────────────────────────────────────
export async function activateSubscription(
  uid: string,
  email: string,
  plan: 'basic' | 'pro',
  paypalSubscriptionId: string,
  planId: string,
) {
  const monthCredits = PLAN_MONTHLY_CREDITS[plan];
  const now = Timestamp.now();
  const end = Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);

  // 更新用户主表
  await updateDoc(doc(db, 'users', uid), {
    plan,
    credits: increment(monthCredits),
    subscriptionId: paypalSubscriptionId,
    subscriptionStatus: 'active',
    subscriptionPlan: plan,
    subscriptionStart: now,
    subscriptionEnd: end,
    subscriptionCancelledAt: null,
  });

  // 写订阅记录
  await setDoc(doc(db, 'subscriptions', paypalSubscriptionId), {
    uid, email, plan,
    status: 'active',
    paypalSubscriptionId,
    planId,
    currentPeriodStart: now,
    currentPeriodEnd: end,
    cancelledAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as SubscriptionRecord);

  // 写积分流水
  const snap = await getDoc(doc(db, 'users', uid));
  const balance = snap.exists() ? (snap.data().credits as number) : monthCredits;
  await addLedgerEntry(uid, {
    type: 'subscription_reset',
    delta: monthCredits,
    balanceAfter: balance,
    description: `订阅 ${plan === 'basic' ? 'Basic' : 'Pro'} 计划，发放月度积分`,
    refId: paypalSubscriptionId,
  });
}

// ─── 订阅续费（Webhook 调用）──────────────────────────────────
export async function renewSubscription(
  uid: string,
  paypalSubscriptionId: string,
  plan: 'basic' | 'pro',
  amount: number,
) {
  const monthCredits = PLAN_MONTHLY_CREDITS[plan];
  const now = Timestamp.now();
  const end = Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);

  await updateDoc(doc(db, 'users', uid), {
    credits: increment(monthCredits),
    subscriptionEnd: end,
    subscriptionStatus: 'active',
  });

  await updateDoc(doc(db, 'subscriptions', paypalSubscriptionId), {
    currentPeriodStart: now,
    currentPeriodEnd: end,
    status: 'active',
    updatedAt: serverTimestamp(),
  });

  // 写续费子集合
  await addDoc(collection(db, 'subscriptions', paypalSubscriptionId, 'billingHistory'), {
    amount,
    currency: 'USD',
    billedAt: now,
    nextBillingAt: end,
    status: 'completed',
  });

  // 写积分流水
  const snap = await getDoc(doc(db, 'users', uid));
  const balance = snap.exists() ? (snap.data().credits as number) : monthCredits;
  await addLedgerEntry(uid, {
    type: 'subscription_reset',
    delta: monthCredits,
    balanceAfter: balance,
    description: `${plan === 'basic' ? 'Basic' : 'Pro'} 订阅续费，重置月度积分`,
    refId: paypalSubscriptionId,
  });
}

// ─── 取消订阅 ─────────────────────────────────────────────────
export async function cancelSubscription(uid: string, paypalSubscriptionId: string) {
  const now = serverTimestamp();
  await updateDoc(doc(db, 'users', uid), {
    subscriptionStatus: 'cancelled',
    subscriptionCancelledAt: now,
  });
  await updateDoc(doc(db, 'subscriptions', paypalSubscriptionId), {
    status: 'cancelled',
    cancelledAt: now,
    updatedAt: now,
  });
}

// ─── 内部：写积分流水 ─────────────────────────────────────────
async function addLedgerEntry(uid: string, entry: Omit<LedgerEntry, 'createdAt'>) {
  await addDoc(collection(db, 'creditLedger', uid, 'entries'), {
    ...entry,
    createdAt: serverTimestamp(),
  });
}
