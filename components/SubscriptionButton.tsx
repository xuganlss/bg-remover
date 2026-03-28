'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { activateSubscription } from '@/lib/userService';

const PAYPAL_CLIENT_ID = 'AcAPfiyzUv1hoJvvkAnBQJ8mGLOySzXm46KYu3lalmatqbPye-FsxEq1kVt-2YZRUBvhV65UCfdlWRI5';

// PayPal Subscription Plan IDs (Sandbox)
// 切换生产时替换为正式 Plan ID
export const PAYPAL_PLAN_IDS = {
  basic: process.env.NEXT_PUBLIC_PAYPAL_PLAN_BASIC ?? 'P-2CN37042J7272960HNHDUIBI',
  pro: process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO ?? 'P-18582952CE534212TNHDUIWQ',
};

interface SubscriptionButtonProps {
  plan: 'basic' | 'pro';
  userSub: string;
  userEmail: string;
  onSuccess: (plan: 'basic' | 'pro', subscriptionId: string) => void;
  onError?: () => void;
}

export default function SubscriptionButton({
  plan, userSub, userEmail, onSuccess, onError,
}: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const planId = PAYPAL_PLAN_IDS[plan];

  if (!planId) {
    return (
      <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
        Payment coming soon
      </button>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: 'USD',
        intent: 'subscription',
        vault: true,
      }}
    >
      {loading && (
        <div className="text-center text-sm text-gray-400 py-2">处理中…</div>
      )}
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'subscribe' }}
        createSubscription={(_data, actions) => {
          return actions.subscription.create({ plan_id: planId });
        }}
        onApprove={async (data) => {
          setLoading(true);
          try {
            await activateSubscription(
              userSub,
              userEmail,
              plan,
              data.subscriptionID!,
              planId,
            );
            onSuccess(plan, data.subscriptionID!);
          } finally {
            setLoading(false);
          }
        }}
        onError={() => {
          setLoading(false);
          console.error('PayPal subscription failed');
          onError?.();
        }}
      />
    </PayPalScriptProvider>
  );
}
