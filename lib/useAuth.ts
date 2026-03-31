'use client';

import { useState, useEffect } from 'react';
import { GoogleUser } from '@/components/GoogleAuthModal';
import { ensureUser, checkCredits } from '@/lib/userService';
import { getStoredAccessToken } from '@/components/GoogleAuthModal';

const STORAGE_KEY = 'bgremover_user';

export function useAuth() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: GoogleUser = JSON.parse(stored);
        setUser(parsed);
        const accessToken = getStoredAccessToken();
        if (accessToken) {
          checkCredits(parsed.sub, accessToken)
            .then(({ credits: c }) => setCredits(c))
            .catch((err) => {
              console.error('Failed to fetch credits:', err);
              if (err.message?.includes('401')) {
                // Token expired, clear and force re-login
                console.warn('Access token expired, please login again');
                localStorage.removeItem('bgremover_access_token');
              }
            });
        }
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
    const accessToken = getStoredAccessToken();
    if (accessToken) {
      await ensureUser(u.sub, { email: u.email, name: u.name, picture: u.picture }, accessToken);
      const { credits: c } = await checkCredits(u.sub, accessToken);
      setCredits(c);
    }
  };

  const signOut = () => {
    setUser(null);
    setCredits(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('bgremover_access_token');
  };

  const refreshCredits = async () => {
    if (!user) return;
    const accessToken = getStoredAccessToken();
    if (accessToken) {
      const { credits: c } = await checkCredits(user.sub, accessToken);
      setCredits(c);
    }
  };

  return { user, credits, setCredits, loading, signIn, signOut, refreshCredits };
}
