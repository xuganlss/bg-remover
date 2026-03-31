'use client';

import { useEffect, useCallback, useState } from 'react';

interface GoogleAuthModalProps {
  onClose: () => void;
  onSuccess: (user: GoogleUser) => void;
}

export interface GoogleUser {
  sub: string;
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
          prompt: (callback?: (notification: { isDisplayed: boolean }) => void) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
        oauth2: {
          initTokenClient: (config: object) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const CLIENT_ID = '603003050506-9ai6hifmqun3dv8l0kiabmmacqvk6ugp.apps.googleusercontent.com';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem('bgremover_access_token');
  } catch {
    return null;
  }
}

export default function GoogleAuthModal({ onClose, onSuccess }: GoogleAuthModalProps) {
  const [isRequestingToken, setIsRequestingToken] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Check if already initialized to prevent duplicate initialization
  const isInitialized = typeof window !== 'undefined' && (window as any).__googleAuthInitialized;

  const handleCredential = useCallback((response: { credential: string }) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));

      const user: GoogleUser = {
        sub: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      // Save user info
      localStorage.setItem('bgremover_user', JSON.stringify(user));
      
      // Request access token for Firestore writes
      if (window.google?.accounts?.oauth2) {
        setIsRequestingToken(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: FIRESTORE_SCOPE,
          prompt: 'consent',
          callback: (tokenResponse: { access_token?: string; error?: string }) => {
            setIsRequestingToken(false);
            if (tokenResponse.access_token) {
              localStorage.setItem('bgremover_access_token', tokenResponse.access_token);
              console.log('✅ Access token obtained successfully');
            } else if (tokenResponse.error) {
              console.error('❌ Token request failed:', tokenResponse.error);
            }
            // Close modal and return user
            onSuccess(user);
            onClose();
          },
        });
        tokenClient.requestAccessToken();
      } else {
        // No OAuth2, just return user
        onSuccess(user);
        onClose();
      }
    } catch (e) {
      console.error('Failed to parse Google credential', e);
    }
  }, [onSuccess, onClose]);

  useEffect(() => {
    // Skip if already initialized
    if (isInitialized) {
      setGoogleReady(true);
      return;
    }

    // Load Google OAuth2 script directly (skip GSI/FedCM)
    if (window.google?.accounts?.oauth2) {
      setGoogleReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleReady(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google script');
      setGoogleReady(false);
    };
    document.body.appendChild(script);
  }, [isInitialized]);

  const handleSignIn = () => {
    // Use OAuth2 flow with both userinfo and datastore scopes
    if (window.google?.accounts?.oauth2) {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'openid email profile ' + FIRESTORE_SCOPE,
        prompt: 'consent',
        callback: (tokenResponse: { access_token?: string; error?: string; id_token?: string; scope?: string }) => {
          if (tokenResponse.id_token) {
            // Got ID token - parse user info
            handleCredential({ credential: tokenResponse.id_token });
          } else if (tokenResponse.access_token) {
            // Got access token only - fetch user info from Google API
            localStorage.setItem('bgremover_access_token', tokenResponse.access_token);
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                'Authorization': `Bearer ${tokenResponse.access_token}`,
              },
            })
              .then(res => res.json())
              .then(userData => {
                const user: GoogleUser = {
                  sub: userData.sub,
                  name: userData.name,
                  email: userData.email,
                  picture: userData.picture,
                };
                localStorage.setItem('bgremover_user', JSON.stringify(user));
                onSuccess(user);
              })
              .catch(err => {
                console.error('Failed to fetch user info:', err);
                alert('Login partially successful. Please refresh and try again.');
              });
          } else if (tokenResponse.error) {
            console.error('Token request failed:', tokenResponse.error);
            alert('Login failed. Please try again.');
          }
        },
      });
      tokenClient.requestAccessToken();
    } else {
      alert('Google login is not available. Please try again later.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
        <p className="text-sm text-gray-500 mb-6">
          Sign in with Google to remove image backgrounds for free.
          <br />Get 3 free credits on signup!
        </p>

        {isRequestingToken ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-purple-600 font-medium">Requesting access token...</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleSignIn}
              disabled={!googleReady}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">
                {googleReady ? 'Sign in with Google' : 'Loading...'}
              </span>
            </button>
            <p className="text-xs text-gray-400">
              By signing in, you agree to our Terms of Service.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
