// v3 - one-time purchases and subscriptions with tabs
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import PayPalButton from '@/components/PayPalButton';
import PayPalSubscriptionButton from '@/components/PayPalSubscriptionButton';
import { getStoredAccessToken } from '@/components/GoogleAuthModal';
import FAQAccordion from '@/components/FAQAccordion';

const PAYPAL_CLIENT_ID = 'ARyamRYAQyWcWcgoCTKaVkphMWOaYvedC_oxliSAOe3lBc4FYZVilRf7Jq61iYQcamSqBfjP1SlKU7mg';

const creditPacks = [
  { name: 'Starter', price: '$4.99', credits: 10, perImage: '$0.50', features: ['10 background removals', 'HD output', 'No watermarks', 'Credits never expire'], popular: false },
  { name: 'Popular', price: '$12.99', credits: 30, perImage: '$0.43', features: ['30 background removals', 'HD output', 'No watermarks', 'Credits never expire', 'Best value'], popular: true },
  { name: 'Pro Pack', price: '$29.99', credits: 80, perImage: '$0.37', features: ['80 background removals', 'HD output', 'No watermarks', 'Credits never expire', 'Priority support'], popular: false },
];

const subscriptionPlans = [
  { 
    name: 'Basic', 
    price: '$9.99', 
    period: '/month',
    credits: 25, 
    perImage: '$0.40', 
    features: ['25 credits/month', 'HD output', 'No watermarks', 'Email support', 'Rollover unused credits'], 
    popular: false,
    planId: 'P-2U716130Y42076319NHFBYXY'
  },
  { 
    name: 'Pro', 
    price: '$19.99', 
    period: '/month',
    credits: 60, 
    perImage: '$0.33', 
    features: ['60 credits/month', 'HD output', 'No watermarks', 'Priority support', 'API access', 'Rollover unused credits'], 
    popular: true,
    planId: 'P-4JS56205PU1505010NHFB2CY'
  },
];

const SUBSCRIPTION_ENABLED = true;

export default function PricingPage() {
  const { user, credits, setCredits, signOut } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'onetime' | 'subscription'>('onetime');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Get or refresh access token when user logs in
  useEffect(() => {
    if (user) {
      const token = getStoredAccessToken();
      setAccessToken(token);
      console.log('Access token status:', token ? '✅ Available' : '❌ Missing');
    } else {
      setAccessToken(null);
    }
  }, [user]);
  useState(() => {
    if (user) {
      const token = getStoredAccessToken();
      setAccessToken(token);
      console.log('Access token status:', token ? '✅ Available' : '❌ Missing');
    } else {
      setAccessToken(null);
    }
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
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
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
            {user ? (
              <div className="flex items-center gap-2">
                {credits !== null && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    {credits} credits
                  </span>
                )}
                <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full border border-gray-200" />
                <span className="text-gray-700 block max-w-[120px] truncate">{user.name}</span>
                <button onClick={signOut} className="text-xs text-red-500 hover:text-red-700 font-medium">Sign out</button>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/'}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50"
              >
                Sign in
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Choose Your Plan</h1>
          <p className="text-gray-500 text-lg">One-time purchases or monthly subscriptions - you decide</p>
        </div>

        {successMsg && (
          <div className="mb-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎉</div>
              <div className="flex-1">
                <div className="font-bold text-green-800 text-lg">Payment Successful!</div>
                <div className="text-green-700 text-sm">{successMsg}</div>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-green-400 hover:text-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-12">
          <div className="flex justify-center">
            <div className="inline-flex bg-white rounded-2xl p-2 shadow-sm border border-gray-200">
              <button
                onClick={() => setActiveTab('onetime')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'onetime'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                💳 One-Time Purchase
              </button>
              <button
                onClick={() => SUBSCRIPTION_ENABLED && setActiveTab('subscription')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'subscription'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${!SUBSCRIPTION_ENABLED ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!SUBSCRIPTION_ENABLED}
                title={!SUBSCRIPTION_ENABLED ? 'Coming soon' : undefined}
              >
                🔄 Monthly Subscription {!SUBSCRIPTION_ENABLED && '(Coming Soon)'}
              </button>
            </div>
          </div>
        </div>

        {/* One-Time Credit Packs Tab */}
        {activeTab === 'onetime' && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Credit Packs</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Credits never expire</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {creditPacks.map((pack) => (
                <div key={pack.name} className={`rounded-3xl p-8 flex flex-col relative ${pack.popular ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl' : 'bg-white border border-gray-200 shadow-sm'}`}>
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs px-3 py-1 rounded-full font-bold">
                      ⭐ Most Popular
                    </div>
                  )}
                  <div className={`text-sm font-semibold uppercase tracking-wide mb-2 ${pack.popular ? 'text-purple-200' : 'text-gray-400'}`}>{pack.name}</div>
                  <div className={`text-4xl font-extrabold mb-1 ${pack.popular ? 'text-white' : 'text-gray-900'}`}>{pack.price}</div>
                  <div className={`text-sm mb-1 ${pack.popular ? 'text-purple-200' : 'text-gray-400'}`}>{pack.credits} credits · {pack.perImage}/image</div>
                  <ul className={`space-y-2 text-sm my-6 flex-1 ${pack.popular ? 'text-purple-100' : 'text-gray-600'}`}>
                    {pack.features.map(f => <li key={f}>✓ {f}</li>)}
                  </ul>
                  {user ? (
                    <div className="mt-2">
                      <PayPalButton
                        amount={pack.price.replace('$', '')}
                        credits={pack.credits}
                        packName={pack.name}
                        userSub={user.sub}
                        userEmail={user.email || ''}
                        onSuccess={(c) => {
                          setCredits(prev => (prev ?? 0) + c);
                          setSuccessMsg(`🎉 Payment successful! ${c} credits added.`);
                        }}
                      />
                    </div>
                  ) : (
                    <Link href="/" className={`block w-full py-3 rounded-xl font-semibold text-sm text-center transition-colors ${pack.popular ? 'bg-white text-purple-600 hover:bg-purple-50' : 'border-2 border-purple-200 text-purple-600 hover:bg-purple-50'}`}>
                      Sign in to purchase
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Plans Tab */}
        {activeTab === 'subscription' && (
          <div className="mb-12">
            {SUBSCRIPTION_ENABLED ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Subscription Plans</h2>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Best Value</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {subscriptionPlans.map((plan) => (
                    <div key={plan.name} className={`rounded-3xl p-8 flex flex-col relative ${plan.popular ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl' : 'bg-white border border-gray-200 shadow-sm'}`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs px-3 py-1 rounded-full font-bold">
                          ⭐ Most Popular
                        </div>
                      )}
                      <div className={`text-sm font-semibold uppercase tracking-wide mb-2 ${plan.popular ? 'text-purple-200' : 'text-gray-400'}`}>{plan.name}</div>
                      <div className={`text-4xl font-extrabold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                        {plan.price}<span className={`text-lg font-medium ${plan.popular ? 'text-purple-200' : 'text-gray-400'}`}>{plan.period}</span>
                      </div>
                      <div className={`text-sm mb-1 ${plan.popular ? 'text-purple-200' : 'text-gray-400'}`}>{plan.credits} credits · {plan.perImage}/image</div>
                      <ul className={`space-y-2 text-sm my-6 flex-1 ${plan.popular ? 'text-purple-100' : 'text-gray-600'}`}>
                        {plan.features.map(f => <li key={f}>✓ {f}</li>)}
                      </ul>
                      {user && accessToken ? (
                        <div className="mt-2">
                          <PayPalSubscriptionButton
                            planId={plan.planId}
                            planName={plan.name as 'Basic' | 'Pro'}
                            creditsPerMonth={plan.credits}
                            userSub={user.sub}
                            accessToken={accessToken}
                            hasActiveSubscription={hasActiveSubscription}
                            onSuccess={() => {
                              setSuccessMsg(`${plan.credits} credits added to your account. New subscription: ${plan.name} plan.`);
                              setHasActiveSubscription(true);
                            }}
                          />
                        </div>
                      ) : (
                        <Link href="/" className={`block w-full py-3 rounded-xl font-semibold text-sm text-center transition-colors ${plan.popular ? 'bg-white text-purple-600 hover:bg-purple-50' : 'border-2 border-purple-200 text-purple-600 hover:bg-purple-50'}`}>
                          🔐 Sign in to subscribe
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🚧</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Subscription Plans Coming Soon</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We're setting up monthly subscription plans. In the meantime, you can purchase one-time credit packs above.
                </p>
                <button
                  onClick={() => setActiveTab('onetime')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  View One-Time Packs →
                </button>
              </div>
            )}
          </div>
        )}

        {/* FAQ Section */}
        <FAQAccordion />

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4">Ready to remove backgrounds?</p>
          <Link href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md shadow-purple-200">
            Try for Free →
          </Link>
        </div>
      </div>

      <footer className="text-center py-8 text-sm text-gray-400 mt-8">
        <p suppressHydrationWarning>© {new Date().getFullYear()} BGRemover · Free AI-powered background removal</p>
      </footer>
    </main>
  );
}

function PricingSections() {
  const { user, setCredits } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  return (
    <div>
      {/* 支付成功提示 */}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-center font-medium">
          {successMsg}
        </div>
      )}
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
              {user ? (
                <div className="mt-2">
                  <PayPalButton
                    amount={pack.price.replace('$', '')}
                    credits={pack.credits}
                    packName={pack.name}
                    userSub={user.sub}
                    userEmail={user.email}
                    onSuccess={(c) => {
                      setCredits(prev => (prev ?? 0) + c);
                      setSuccessMsg(`🎉 Payment successful! ${c} credits added.`);
                    }}
                  />
                </div>
              ) : (
                <Link
                  href="/"
                  className={`block w-full py-3 rounded-xl font-semibold text-sm text-center transition-colors ${
                    pack.popular
                      ? 'bg-white text-purple-600 hover:bg-purple-50'
                      : 'border-2 border-purple-200 text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Sign in to purchase
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
