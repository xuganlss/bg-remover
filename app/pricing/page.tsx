import Link from 'next/link';

const faqs = [
  {
    q: 'How does the free plan work?',
    a: 'Sign up and get 3 free image background removals. No credit card required. Credits never expire.',
  },
  {
    q: 'What image formats are supported?',
    a: 'We support JPG, PNG, and WebP. Output is always a high-quality transparent PNG.',
  },
  {
    q: 'How accurate is the background removal?',
    a: 'Our AI handles hair, fur, complex edges, and transparent objects with high precision — powered by remove.bg technology.',
  },
  {
    q: 'Can I use the images commercially?',
    a: 'Yes. All images you process are yours to use for any purpose, including commercial projects.',
  },
  {
    q: 'When will payment be available?',
    a: 'We\'re integrating PayPal. Paid plans will be available soon — sign up to be notified.',
  },
  {
    q: 'Do credits expire?',
    a: 'One-time credit packs never expire. Monthly subscription credits reset each billing cycle.',
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
              </svg>
            </div>
            <span className="font-bold text-gray-800">BGRemover</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <Link href="/pricing" className="text-purple-600 font-medium">Pricing</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Simple, Transparent Pricing</h1>
          <p className="text-gray-500 text-lg">Start for free. Upgrade when you need more.</p>
        </div>

        {/* Tab: Credits / Subscription */}
        <PricingTabs />

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 group"
              >
                <summary className="px-6 py-4 cursor-pointer font-medium text-gray-800 list-none flex items-center justify-between">
                  {faq.q}
                  <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-500 text-sm leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4">Ready to get started?</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md shadow-purple-200"
          >
            Try for Free →
          </Link>
        </div>
      </div>

      <footer className="text-center py-8 text-sm text-gray-400">
        <p suppressHydrationWarning>© {new Date().getFullYear()} BGRemover · Free AI-powered background removal</p>
      </footer>
    </main>
  );
}

function PricingTabs() {
  // 静态展示，后期接 PayPal 时改为动态
  return (
    <div>
      {/* Tab buttons */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 flex gap-1">
          <button className="px-5 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium">Credit Packs</button>
          <button className="px-5 py-2 rounded-lg text-gray-500 text-sm font-medium hover:bg-gray-50">Monthly Plans</button>
        </div>
      </div>

      {/* Credit Packs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Starter */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Starter</div>
          <div className="text-4xl font-extrabold text-gray-900 mb-1">$4.99</div>
          <div className="text-gray-400 text-sm mb-6">50 credits · never expires</div>
          <ul className="space-y-2 text-sm text-gray-600 mb-8 flex-1">
            <li>✓ 50 background removals</li>
            <li>✓ Full resolution output</li>
            <li>✓ No watermarks</li>
            <li>✓ Credits never expire</li>
          </ul>
          <button className="w-full py-3 border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors text-sm">
            Payment coming soon
          </button>
        </div>

        {/* Popular */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-xl p-8 flex flex-col relative text-white">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs px-3 py-1 rounded-full font-bold">⭐ Most Popular</div>
          <div className="text-sm font-semibold uppercase tracking-wide mb-2 text-purple-200">Popular</div>
          <div className="text-4xl font-extrabold mb-1">$12.99</div>
          <div className="text-purple-200 text-sm mb-6">200 credits · never expires</div>
          <ul className="space-y-2 text-sm text-purple-100 mb-8 flex-1">
            <li>✓ 200 background removals</li>
            <li>✓ Full resolution output</li>
            <li>✓ No watermarks</li>
            <li>✓ Credits never expire</li>
            <li>✓ Best value per image</li>
          </ul>
          <button className="w-full py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors text-sm">
            Payment coming soon
          </button>
        </div>

        {/* Pro */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Pro</div>
          <div className="text-4xl font-extrabold text-gray-900 mb-1">$29.99</div>
          <div className="text-gray-400 text-sm mb-6">600 credits · never expires</div>
          <ul className="space-y-2 text-sm text-gray-600 mb-8 flex-1">
            <li>✓ 600 background removals</li>
            <li>✓ Full resolution output</li>
            <li>✓ No watermarks</li>
            <li>✓ Credits never expire</li>
            <li>✓ Priority support</li>
          </ul>
          <button className="w-full py-3 border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors text-sm">
            Payment coming soon
          </button>
        </div>
      </div>

      {/* Monthly plans hint */}
      <p className="text-center text-sm text-gray-400 mt-6">
        Monthly subscription plans coming soon. <a href="/" className="text-purple-500 hover:underline">Try for free</a> in the meantime.
      </p>
    </div>
  );
}
