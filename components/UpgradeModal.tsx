'use client';

interface UpgradeModalProps {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 图标 */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
          <span className="text-3xl">⚡</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">You've used all your free credits</h2>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          Upgrade to keep removing backgrounds — no watermarks, instant results.
        </p>

        {/* 套餐卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* 基础包 */}
          <div className="border border-gray-200 rounded-2xl p-4 text-left hover:border-purple-300 transition-colors">
            <div className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wide">Basic</div>
            <div className="text-2xl font-bold text-gray-900">$4.9<span className="text-sm font-normal text-gray-400">/mo</span></div>
            <div className="text-xs text-gray-500 mt-2">100 images/month</div>
          </div>
          {/* 专业包 */}
          <div className="border-2 border-purple-500 rounded-2xl p-4 text-left relative bg-purple-50">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Popular</div>
            <div className="text-xs text-purple-600 font-medium mb-1 uppercase tracking-wide">Pro</div>
            <div className="text-2xl font-bold text-gray-900">$9.9<span className="text-sm font-normal text-gray-400">/mo</span></div>
            <div className="text-xs text-gray-500 mt-2">500 images/month</div>
          </div>
        </div>

        {/* 积分包 */}
        <div className="border border-dashed border-gray-200 rounded-2xl p-3 mb-6 text-sm text-gray-500 flex items-center justify-between">
          <span>Just need a few? <strong className="text-gray-700">50 credits for $1.9</strong></span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">One-time</span>
        </div>

        {/* CTA 按钮（暂时跳转到 pricing 页面） */}
        <a
          href="/pricing"
          className="block w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md shadow-purple-200 mb-3"
        >
          Upgrade Now →
        </a>
        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
