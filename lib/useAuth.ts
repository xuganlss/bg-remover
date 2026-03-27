'use client';

import { useState, useEffect } from 'react';
import { GoogleUser } from '@/components/GoogleAuthModal';
import { ensureUser, checkCredits } from '@/lib/userService';

const STORAGE_KEY = 'bgremover_user';

export function useAuth() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 页面加载时从 localStorage 恢复登录状态
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: GoogleUser = JSON.parse(stored);
        setUser(parsed);
        // 异步刷新 credits
        checkCredits(parsed.sub).then(({ credits: c }) => setCredits(c));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (u: GoogleUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    await ensureUser(u.sub, { email: u.email, name: u.name, picture: u.picture });
    const { credits: c } = await checkCredits(u.sub);
    setCredits(c);
  };

  const signOut = () => {
    setUser(null);
    setCredits(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshCredits = async () => {
    if (!user) return;
    const { credits: c } = await checkCredits(user.sub);
    setCredits(c);
  };

  return { user, credits, setCredits, loading, signIn, signOut, refreshCredits };
}
