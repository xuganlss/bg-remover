'use client';

import { useState, useCallback } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageComparison from '@/components/ImageComparison';
import BackgroundColorPicker from '@/components/BackgroundColorPicker';
import GoogleAuthModal, { GoogleUser } from '@/components/GoogleAuthModal';
import { ensureUser, incrementUsage } from '@/lib/userService';

type Status = 'idle' | 'processing' | 'done' | 'error';

const REMOVE_BG_API_KEY = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY || '';

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [bgColor, setBgColor] = useState('transparent');
  const [errorMsg, setErrorMsg] = useState('');

  // Google 登录状态
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleImageSelect = useCallback(async (file: File, previewUrl: string) => {
    // 未登录时拦截，弹出登录弹窗
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setOriginalUrl(previewUrl);
    setStatus('processing');
    setErrorMsg('');

    const form = new FormData();
    form.append('image_file', file);
    form.append('size', 'auto');

    try {
      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.errors?.[0]?.title || 'Background removal failed';
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus('done');
      // 记录使用次数到 Firestore
      if (user?.sub) {
        incrementUsage(user.sub).catch(console.error);
      }
    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, [user]);

  const handleReset = () => {
    setStatus('idle');
    setOriginalUrl('');
    setResultUrl('');
    setErrorMsg('');
    setBgColor('transparent');
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `bg-removed-${Date.now()}.png`;
    a.click();
  };

  const handleSignOut = () => {
    setUser(null);
  };

  return (
    <>
      {/* Google Identity Services SDK */}
      <script
        id="google-gsi-script"
        src="https://accounts.google.com/gsi/client"
        async
        defer
      />

      {/* 登录弹窗 */}
      {showAuthModal && (
        <GoogleAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={async (u) => {
            setUser(u);
            setShowAuthModal(false);
            // 用 sub (Google uid) 作为 Firestore 文档 ID
            if (u.sub) {
              await ensureUser(u.sub, { email: u.email, name: u.name, picture: u.picture });
            }
          }}
        />
      )}

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Header */}
        <header className="border-b border-white/60 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                </svg>
              </div>
              <span className="font-bold text-gray-800">BGRemover</span>
            </div>

            {/* 登录/用户信息区 */}
            {user ? (
              <div className="flex items-center gap-2">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
                <span className="text-sm text-gray-700 hidden sm:block">{user.name}</span>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-1"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-50"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full mb-4 font-medium">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              Powered by AI
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              Remove Image Background<br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Instantly & For Free
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Upload any photo — AI removes the background in seconds.
              No watermarks. Download as transparent PNG.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 p-6 sm:p-10">
            {status === 'idle' && (
              <>
                <ImageUploader onImageSelect={handleImageSelect} />
                {/* 未登录提示 */}
                {!user && (
                  <p className="text-center text-sm text-gray-400 mt-4">
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-purple-600 font-medium hover:underline"
                    >
                      Sign in
                    </button>
                    {' '}to start removing backgrounds
                  </p>
                )}
              </>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                {originalUrl && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden mb-2 opacity-60">
                    <img src={originalUrl} alt="Processing" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p className="text-gray-600 font-medium">Removing background…</p>
                <p className="text-sm text-gray-400">Usually takes 2–5 seconds</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold">{errorMsg}</p>
                <button onClick={handleReset} className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                  Try Again
                </button>
              </div>
            )}

            {status === 'done' && resultUrl && originalUrl && (
              <div className="space-y-6">
                <ImageComparison originalUrl={originalUrl} resultUrl={resultUrl} bgColor={bgColor} />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <BackgroundColorPicker value={bgColor} onChange={setBgColor} />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      ↩ New Image
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold shadow-md shadow-purple-200"
                    >
                      ↓ Download PNG
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {[
              { icon: '⚡', title: 'Instant Results', desc: 'AI processes your image in 2–5 seconds' },
              { icon: '🔒', title: 'Privacy First', desc: 'Images are never stored or saved' },
              { icon: '✨', title: 'High Quality', desc: 'Crisp edges, even for hair & fur' },
            ].map((f) => (
              <div key={f.title} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-white">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* SEO Content */}
          <section className="mt-16 max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">How to Remove Image Background</h2>
            <ol className="space-y-2 text-gray-600">
              <li><strong>1. Upload</strong> — Drag & drop or click to upload your JPG, PNG, or WebP image.</li>
              <li><strong>2. Wait</strong> — Our AI automatically detects and removes the background.</li>
              <li><strong>3. Download</strong> — Save your image as a transparent PNG or choose a background color.</li>
            </ol>
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-gray-400 mt-8">
          <p suppressHydrationWarning>© {new Date().getFullYear()} BGRemover · Free AI-powered background removal</p>
        </footer>
      </main>
    </>
  );
}
