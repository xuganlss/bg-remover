import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type Plan = 'free' | 'basic' | 'pro';

export interface UserRecord {
  email: string;
  name: string;
  picture: string;
  plan: Plan;
  credits: number;          // 剩余点数（free 用户用完不重置，订阅用户每月重置）
  usageCount: number;       // 累计使用次数
  createdAt: unknown;
  lastUsedAt: unknown;
}

const FREE_SIGNUP_CREDITS = 3;

// 用户首次登录时创建记录，已存在则跳过
export async function ensureUser(uid: string, profile: { email: string; name: string; picture: string }) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      plan: 'free',
      credits: FREE_SIGNUP_CREDITS,   // 注册送 3 次
      usageCount: 0,
      createdAt: serverTimestamp(),
      lastUsedAt: serverTimestamp(),
    });
  }
}

// 检查用户是否有剩余额度
export async function checkCredits(uid: string): Promise<{ ok: boolean; credits: number; plan: Plan }> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, credits: 0, plan: 'free' };
  const data = snap.data() as UserRecord;
  return {
    ok: data.credits > 0,
    credits: data.credits,
    plan: data.plan,
  };
}

// 抠图成功后扣减一次额度
export async function consumeCredit(uid: string) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    credits: increment(-1),
    usageCount: increment(1),
    lastUsedAt: serverTimestamp(),
  });
}

// 获取用户数据
export async function getUser(uid: string): Promise<UserRecord | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserRecord) : null;
}
