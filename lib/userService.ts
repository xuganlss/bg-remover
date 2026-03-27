import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserRecord {
  email: string;
  name: string;
  picture: string;
  usageCount: number;
  createdAt: unknown;
  lastUsedAt: unknown;
}

// 用户首次登录时创建记录，已存在则跳过
export async function ensureUser(uid: string, profile: { email: string; name: string; picture: string }) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      usageCount: 0,
      createdAt: serverTimestamp(),
      lastUsedAt: serverTimestamp(),
    });
  }
}

// 每次抠图成功后调用，增加使用次数
export async function incrementUsage(uid: string) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
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
