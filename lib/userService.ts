import {
  docRef, getDoc, setDoc, updateDoc, increment,
  serverTimestamp, createDoc, Timestamp, collection, query, where, getDocs,
} from './firebase';

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
export async function ensureUser(uid: string, profile: { email: string; name: string; picture: string }, accessToken: string) {
  const ref = docRef('users', uid);
  const snap = await getDoc(ref, accessToken);
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
    }, accessToken);
    // 注册赠送积分流水
    await addLedgerEntry(uid, {
      type: 'signup_bonus',
      delta: FREE_SIGNUP_CREDITS,
      balanceAfter: FREE_SIGNUP_CREDITS,
      description: '注册赠送积分',
      refId: uid,
    }, accessToken);
  } else {
    const data = snap.data();
    if (data.credits === undefined) {
      await updateDoc(ref, { credits: FREE_SIGNUP_CREDITS, plan: 'free' }, accessToken);
    }
  }
}

// ─── 积分检查 ─────────────────────────────────────────────────
export async function checkCredits(uid: string, accessToken: string): Promise<{ ok: boolean; credits: number; plan: Plan }> {
  const ref = docRef('users', uid);
  const snap = await getDoc(ref, accessToken);
  if (!snap.exists()) return { ok: false, credits: 0, plan: 'free' };
  const data = snap.data() as unknown as UserRecord;
  return { ok: data.credits > 0, credits: data.credits as number, plan: data.plan as Plan };
}

// ─── 消费积分 ─────────────────────────────────────────────────
export async function consumeCredit(uid: string, accessToken: string) {
  const ref = docRef('users', uid);
  await updateDoc(ref, {
    credits: increment(-1),
    usageCount: increment(1),
    lastUsedAt: serverTimestamp(),
  }, accessToken);
  // 写流水（balanceAfter 需重新读，简单起见用 -1 近似；生产可用事务）
  const snap = await getDoc(ref, accessToken);
  const balance = snap.exists() ? (snap.data().credits as number) : 0;
  await addLedgerEntry(uid, {
    type: 'consume',
    delta: -1,
    balanceAfter: balance,
    description: '抠图使用',
    refId: '',
  }, accessToken);
}

// ─── 用户信息 ─────────────────────────────────────────────────
export async function getUser(uid: string, accessToken: string): Promise<UserRecord | null> {
  const ref = docRef('users', uid);
  const snap = await getDoc(ref, accessToken);
  return snap.exists() ? (snap.data() as unknown as UserRecord) : null;
}

// ─── 积分购买记录 ─────────────────────────────────────────────
export async function recordCreditOrder(order: Omit<CreditOrder, 'createdAt'>, accessToken: string) {
  await setDoc(docRef('creditOrders', order.paypalOrderId), {
    ...order,
    createdAt: serverTimestamp(),
  }, accessToken);
}

// ─── 购买积分后更新用户 + 写流水 ─────────────────────────────
export async function applyPurchasedCredits(
  uid: string,
  credits: number,
  orderId: string,
  packName: string,
  amount: number,
  email: string,
  accessToken: string,
) {
  const ref = docRef('users', uid);
  await updateDoc(ref, { credits: increment(credits) }, accessToken);

  // 写购买记录
  await recordCreditOrder({
    uid, email, amount, credits, packName,
    paypalOrderId: orderId,
    status: 'completed',
  }, accessToken);

  // 写流水
  const snap = await getDoc(ref, accessToken);
  const balance = snap.exists() ? (snap.data().credits as number) : credits;
  await addLedgerEntry(uid, {
    type: 'purchase',
    delta: credits,
    balanceAfter: balance,
    description: `购买 ${packName}（${credits} 积分）`,
    refId: orderId,
  }, accessToken);
}

// ─── 激活订阅 ─────────────────────────────────────────────────
export async function activateSubscription(
  uid: string,
  email: string,
  plan: 'basic' | 'pro',
  paypalSubscriptionId: string,
  planId: string,
  accessToken: string,
) {
  const monthCredits = PLAN_MONTHLY_CREDITS[plan];
  const now = Timestamp.now();
  const endMillis = now.toMillis() + 30 * 24 * 60 * 60 * 1000;
  const end = new Timestamp(Math.floor(endMillis / 1000), (endMillis % 1000) * 1000000);

  // 更新用户主表
  await updateDoc(docRef('users', uid), {
    plan,
    credits: increment(monthCredits),
    subscriptionId: paypalSubscriptionId,
    subscriptionStatus: 'active',
    subscriptionPlan: plan,
    subscriptionStart: now,
    subscriptionEnd: end,
    subscriptionCancelledAt: null,
  }, accessToken);

  // 写订阅记录
  await setDoc(docRef('subscriptions', paypalSubscriptionId), {
    uid, email, plan,
    status: 'active',
    paypalSubscriptionId,
    planId,
    currentPeriodStart: now,
    currentPeriodEnd: end,
    cancelledAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as unknown as Record<string, unknown>, accessToken);

  // 写积分流水
  const snap = await getDoc(docRef('users', uid), accessToken);
  const balance = snap.exists() ? (snap.data().credits as number) : monthCredits;
  await addLedgerEntry(uid, {
    type: 'subscription_reset',
    delta: monthCredits,
    balanceAfter: balance,
    description: `订阅 ${plan === 'basic' ? 'Basic' : 'Pro'} 计划，发放月度积分`,
    refId: paypalSubscriptionId,
  }, accessToken);
}

// ─── 订阅续费（Webhook 调用）──────────────────────────────────
export async function renewSubscription(
  uid: string,
  paypalSubscriptionId: string,
  plan: 'basic' | 'pro',
  amount: number,
  accessToken: string,
) {
  const monthCredits = PLAN_MONTHLY_CREDITS[plan];
  const now = Timestamp.now();
  const endMillis = now.toMillis() + 30 * 24 * 60 * 60 * 1000;
  const end = new Timestamp(Math.floor(endMillis / 1000), (endMillis % 1000) * 1000000);

  await updateDoc(docRef('users', uid), {
    credits: increment(monthCredits),
    subscriptionEnd: end,
    subscriptionStatus: 'active',
  }, accessToken);

  await updateDoc(docRef('subscriptions', paypalSubscriptionId), {
    currentPeriodStart: now,
    currentPeriodEnd: end,
    status: 'active',
    updatedAt: serverTimestamp(),
  }, accessToken);

  // 写积分流水
  const snap = await getDoc(docRef('users', uid), accessToken);
  const balance = snap.exists() ? (snap.data().credits as number) : monthCredits;
  await addLedgerEntry(uid, {
    type: 'subscription_reset',
    delta: monthCredits,
    balanceAfter: balance,
    description: `${plan === 'basic' ? 'Basic' : 'Pro'} 订阅续费，重置月度积分`,
    refId: paypalSubscriptionId,
  }, accessToken);
}

// ─── 取消订阅 ─────────────────────────────────────────────────
export async function cancelSubscription(uid: string, paypalSubscriptionId: string, accessToken: string) {
  const now = serverTimestamp();
  await updateDoc(docRef('users', uid), {
    subscriptionStatus: 'cancelled',
    subscriptionCancelledAt: now,
  }, accessToken);
  await updateDoc(docRef('subscriptions', paypalSubscriptionId), {
    status: 'cancelled',
    cancelledAt: now,
    updatedAt: now,
  }, accessToken);
}

// ─── 内部：写积分流水 ─────────────────────────────────────────
async function addLedgerEntry(uid: string, entry: Omit<LedgerEntry, 'createdAt'>, accessToken: string) {
  await createDoc('creditLedger', {
    uid,
    ...entry,
    createdAt: serverTimestamp(),
  }, accessToken);
}
