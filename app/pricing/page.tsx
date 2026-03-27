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
    a: "We're integrating PayPal. Paid plans will be available soon — sign up to be notified.",
  },
  {
    q: 'Do credits expire?',
    a: 'One-time credit packs never expire. Monthly subscription credits reset each billing cycle.',
  },
];

const creditPacks = [
  {
    name: 'Starter',
    price: '$4.99',
    credits: 10,
    perImage: '$0.50',
    features: ['10 background removals', 'HD output', 'No watermarks', 'Credits never expire'],
    popular: false,
  },
  {
    name: 'Popular',
    price: '$12.99',
    credits: 30,
    perImage: '$0.43',
    features: ['30 background removals', 'HD output', 'No watermarks', 'Credits never expire', 'Best value'],
    popular: true,
  },
  {
    name: 'Pro Pack',
    price: '$29.99',
    credits: 80,
    perImage: '$0.37',
    features: ['80 background removals', 'HD output', 'No watermarks', 'Credits never expire', 'Priority support'],
    popular: false,
  },
];

const monthlyPlans = [
  {
    name: 'Basic',
    price: '$9.99',
    period: '/mo',
    credits: 25,
    perImage: '$0.40',
    features: ['25 images/month', 'HD output', 'No watermarks', 'Auto-renews monthly'],
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19.99',
    period: '/mo',
    credits: 60,
    perImage: '$0.33',
    features: ['60 images/month', 'HD output', 'No watermarks', 'Auto-renews monthly', 'Priority support'],
    popular: true,
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
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Remove Backgrounds Instantly
          </h1>
          <p className="text-gray-500 text-lg">Start free · No design skills needed</p>
        </div>

        {/* Pricing Sections */}
        <PricingSections />

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {faqs.map((faq) => (
              <details key={faq.q} className="bg-white rounded-2xl shadow-sm border border-gray-100 group">
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
          <p className="text-gray-500 mb-4">Not ready to pay? Start with 3 free credits.</p>
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

function PricingSections() {
  return (
    <div>
      {/* Credit Packs */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Credit Packs</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Credits never expire</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {creditPacks.map((pack) => (
            <div
              key={pack.name}
              className={`rounded-3xl p-8 flex flex-col relative ${
                pack.popular
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs px-3 py-1 rounded-full font-bold">
                  ⭐ Most Popular
                </div>
              )}
              <div className={`text-sm font-semibold uppercase tracking-wide mb-2 ${pack.popular ? 'text-purple-200' : 'text-gray-400'}`}>
                {pack.name}
              </div>
              <div className={`text-4xl font-extrabold mb-1 ${pack.popular ? 'text-white' : 'text-gray-900'}`}>
                {pack.price}
              </div>
              <div className={`text-sm mb-1 ${pack.popular ? 'text-purple-200' : 'text-gray-400'}`}>
                {pack.credits} credits · {pack.perImage}/image
              </div>
              <ul className={`space-y-2 text-sm my-6 flex-1 ${pack.popular ? 'text-purple-100' : 'text-gray-600'}`}>
                {pack.features.map(f => <li key={f}>✓ {f}</li>)}
              </ul>
              <button
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  pack.popular
                    ? 'bg-white text-purple-600 hover:bg-purple-50'
                    : 'border-2 border-purple-200 text-purple-600 hover:bg-purple-50'
                }`}
              >
                Payment coming soon
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Plans */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Monthly Subscription</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Auto-renews</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          {monthlyPlans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 flex flex-col relative ${
                plan.popular
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs px-3 py-1 rounded-full font-bold">
                  ⭐ Best Value
                </div>
              )}
              <div className={`text-sm font-semibold uppercase tracking-wide mb-2 ${plan.popular ? 'text-purple-200' : 'text-gray-400'}`}>
                {plan.name}
              </div>
              <div className={`text-4xl font-extrabold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                {plan.price}<span className={`text-base font-normal ${plan.popular ? 'text-purple-200' : 'text-gray-400'}`}>{plan.period}</span>
              </div>
              <div className={`text-sm mb-1 ${plan.popular ? 'text-purple-200' : 'text-gray-400'}`}>
                {plan.credits} images/month · {plan.perImage}/image
              </div>
              <ul className={`space-y-2 text-sm my-6 flex-1 ${plan.popular ? 'text-purple-100' : 'text-gray-600'}`}>
                {plan.features.map(f => <li key={f}>✓ {f}</li>)}
              </ul>
              <button
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.popular
                    ? 'bg-white text-purple-600 hover:bg-purple-50'
                    : 'border-2 border-purple-200 text-purple-600 hover:bg-purple-50'
                }`}
              >
                Payment coming soon
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
