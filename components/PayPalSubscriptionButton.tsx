'use client';

import { useState, useMemo } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalSubscriptionButtonProps {
  planId: string;
  planName: 'Basic' | 'Pro';
  creditsPerMonth: number;
  userSub: string;
  accessToken: string;
  hasActiveSubscription?: boolean;
  onSuccess?: () => void;
}

export default function PayPalSubscriptionButton({ 
  planId, 
  planName, 
  creditsPerMonth, 
  userSub, 
  accessToken,
  hasActiveSubscription,
  onSuccess 
}: PayPalSubscriptionButtonProps) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stable key for PayPal buttons - only changes when plan changes
  const buttonKey = useMemo(() => `${planName}-${planId}`, [planName, planId]);
  
  // Debug logging
  console.log('[PayPalSubscriptionButton]', { 
    planName, 
    planId, 
    hasAccessToken: !!accessToken, 
    hasActiveSubscription,
    userSub,
    buttonKey
  });

  const handleApprove = async (data: any, actions: any) => {
    try {
      // Verify access token exists
      const token = accessToken || localStorage.getItem('bgremover_access_token');
      
      if (!token) {
        setError('❌ No access token. Please sign out and sign in again to refresh your session.');
        console.error('Firestore write failed: No access token');
        return;
      }

      // Get subscription details
      const details = await actions.subscription.get();
      const subscriptionId = data.subscriptionID;
      
      console.log('Saving subscription to Firestore:', { userId: userSub, planId, subscriptionId });
      
      // Save subscription to Firestore
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userSub,
          planId,
          planName,
          paypalSubscriptionId: subscriptionId,
          status: 'ACTIVE',
          creditsPerMonth,
        }),
      });

      if (res.ok) {
        console.log('✅ Subscription saved successfully');
        setSuccess(true);
        setError(null);
        onSuccess?.();
      } else {
        const errData = await res.json();
        console.error('Failed to save subscription:', errData);
        setError(errData.error || 'Failed to save subscription');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to complete subscription: ${errorMsg}`);
    }
  };

  if (success) {
    return (
      <div className="w-full py-3 px-4 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">🎉</span>
          <div>
            <div className="font-bold text-green-800 text-sm">Payment Successful!</div>
            <div className="text-green-700 text-xs">{creditsPerMonth} credits added to your account</div>
          </div>
        </div>
      </div>
    );
  }

  // Show disabled state if user already has active subscription
  if (hasActiveSubscription) {
    return (
      <div className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-xl text-center cursor-not-allowed">
        <div className="text-sm text-gray-500 font-medium">✓ Active Subscription</div>
        <div className="text-xs text-gray-400 mt-1">Manage in My Account section</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-600 rounded text-xs text-center">
          <div className="font-semibold mb-1">⚠️ Error</div>
          <div className="text-[10px] break-all">{error}</div>
          <div className="text-[9px] mt-1 text-gray-500">Plan ID: {planId}</div>
        </div>
      )}
      <PayPalScriptProvider
        options={{
          clientId: 'ARyamRYAQyWcWcgoCTKaVkphMWOaYvedC_oxliSAOe3lBc4FYZVilRf7Jq61iYQcamSqBfjP1SlKU7mg',
          currency: 'USD',
          vault: true,
          intent: 'subscription',
          components: 'buttons',
        }}
      >
        <PayPalButtons
          key={buttonKey}
          style={{
            layout: 'vertical',
            shape: 'rect',
            color: 'gold',
            label: 'subscribe',
            height: 45,
          }}
        createSubscription={async (data, actions) => {
          try {
            console.log('Creating subscription with plan ID:', planId);
            const subscriptionId = await actions.subscription.create({
              plan_id: planId,
            });
            console.log('Subscription created:', subscriptionId);
            return subscriptionId;
          } catch (err) {
            console.error('createSubscription failed:', err);
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to create subscription: ${errorMsg}\n\nPlan ID: ${planId}\n\nPlease verify:\n1. Plan ID is correct\n2. Plan is ACTIVE in PayPal\n3. Client ID matches environment (Sandbox/Live)`);
            throw err;
          }
        }}
        onApprove={handleApprove}
        onError={(err) => {
          console.error('PayPal subscription error:', err);
          const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
          setError(`PayPal error: ${errorMsg}\n\nPlan ID: ${planId}`);
        }}
      />
      </PayPalScriptProvider>
    </div>
  );
}
