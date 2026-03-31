'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getStoredAccessToken } from '@/components/GoogleAuthModal';
import { addCredits } from '@/lib/userService';

interface UpgradeModalProps {
  onClose: () => void;
  userSub: string;
  currentCredits: number | null;
  onCreditsAdded: (newCredits: number) => void;
}

const PAYPAL_CLIENT_ID = 'AcAPfiyzUv1hoJvvkAnBQJ8mGLOySzXm46KYu3lalmatqbPye-FsxEq1kVt-2YZRUBvhV65UCfdlWRI5';
const FIREBASE_PROJECT = 'bg-remover-f38d1';

const creditPacks = [
  { name: 'Starter', price: '$4.99', credits: 10, perImage: '$0.50' },
  { name: 'Popular', price: '$12.99', credits: 30, perImage: '$0.43', popular: true },
  { name: 'Pro Pack', price: '$29.99', credits: 80, perImage: '$0.37' },
];

async function addCreditsFirestore(userSub: string, credits: number): Promise<void> {
  const accessToken = getStoredAccessToken();
  if (!accessToken) throw new Error('No access token');
  await addCredits(userSub, credits, accessToken);
}

export default function UpgradeModal({ onClose, userSub, currentCredits, onCreditsAdded }: UpgradeModalProps) {
  const [selectedPack, setSelectedPack] = useState<typeof creditPacks[0] | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💎</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Need More Credits?</h2>
          <p className="text-gray-500">Choose a credit pack that fits your needs.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {creditPacks.map((pack) => (
            <div
              key={pack.name}
              className={`rounded-2xl p-5 border-2 cursor-pointer transition-all ${
                pack.popular
                  ? 'border-purple-500 bg-purple-50'
                  : selectedPack?.name === pack.name
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-200'
              }`}
              onClick={() => setSelectedPack(pack)}
            >
              {pack.popular && (
                <div className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold inline-block mb-2">
                  ⭐ Most Popular
                </div>
              )}
              <div className="text-sm font-semibold text-gray-500 mb-1">{pack.name}</div>
              <div className="text-2xl font-extrabold text-gray-900 mb-1">{pack.price}</div>
              <div className="text-sm text-gray-500 mb-2">{pack.credits} credits · {pack.perImage}/image</div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                pack.popular ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}>
                Credits never expire
              </div>
            </div>
          ))}
        </div>

        {selectedPack && (
          <div className="border-t pt-6">
            <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
              <PayPalButtons
                style={{ layout: 'horizontal', shape: 'rect', color: 'gold', label: 'pay' }}
                createOrder={(_data, actions) => {
                  return actions.order.create({
                    intent: 'CAPTURE',
                    purchase_units: [{
                      amount: { currency_code: 'USD', value: selectedPack.price.replace('$', '') },
                      description: `BGRemover - ${selectedPack.credits} credits`,
                    }],
                  });
                }}
                onApprove={async (_data, actions) => {
                  const order = await actions.order!.capture();
                  if (order.status === 'COMPLETED') {
                    try {
                      await addCreditsFirestore(userSub, selectedPack.credits);
                      onCreditsAdded(selectedPack.credits);
                      onClose();
                    } catch (e) {
                      console.error('Failed to add credits:', e);
                    }
                  }
                }}
                onError={() => {
                  console.error('PayPal payment failed');
                }}
              />
            </PayPalScriptProvider>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Secure payment powered by PayPal · Credits never expire
        </p>
      </div>
    </div>
  );
}
