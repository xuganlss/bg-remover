'use client';

import { useEffect, useCallback } from 'react';

interface GoogleAuthModalProps {
  onClose: () => void;
  onSuccess: (user: GoogleUser) => void;
}

export interface GoogleUser {
  sub: string;   // Google 用户唯一 ID，用作 Firestore 文档 ID
  name: string;
  email: string;
  picture: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
    handleGoogleCredential: (response: { credential: string }) => void;
  }
}

const CLIENT_ID = '603003050506-9ai6hifmqun3dv8l0kiabmmacqvk6ugp.apps.googleusercontent.com';

export default function GoogleAuthModal({ onClose, onSuccess }: GoogleAuthModalProps) {

  const handleCredential = useCallback((response: { credential: string }) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      onSuccess({
        sub: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
    } catch (e) {
      console.error('Failed to parse Google credential', e);
    }
  }, [onSuccess]);

  useEffect(() => {
    // 挂到 window 上，确保 Google SDK 能找到回调
    window.handleGoogleCredential = handleCredential;

    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,  // 直接用闭包，不走 window
        ux_mode: 'popup',
      });

      const btn = document.getElementById('google-signin-btn');
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'signin_with',
          shape: 'rectangular',
          locale: 'en',
        });
      }
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      // SDK 还没加载完，等它
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleCredential]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 图标 */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
        <p className="text-sm text-gray-500 mb-6">
          Sign in with Google to remove image backgrounds for free.
          <br />No credit card required.
        </p>

        {/* Google 登录按钮容器 */}
        <div className="flex justify-center mb-4">
          <div id="google-signin-btn"></div>
        </div>

        <p className="text-xs text-gray-400">
          By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
