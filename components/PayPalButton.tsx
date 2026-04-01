'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { applyPurchasedCredits } from '@/lib/userService';
import { getStoredAccessToken } from '@/components/GoogleAuthModal';

const PAYPAL_CLIENT_ID = 'ARyamRYAQyWcWcgoCTKaVkphMWOaYvedC_oxliSAOe3lBc4FYZVilRf7Jq61iYQcamSqBfjP1SlKU7mg';

interface PayPalButtonProps {
  amount: string;       // e.g. "4.99"
  credits: number;      // e.g. 10
  packName: string;     // e.g. 'Popular'
  userSub: string;      // Firestore user doc ID
  userEmail: string;
  onSuccess: (credits: number) => void;
  onError?: () => void;
}

export default function PayPalButton({
  amount, credits, packName, userSub, userEmail, onSuccess, onError,
}: PayPalButtonProps) {
  return (
    <PayPalButtons
      style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'pay' }}
        createOrder={(_data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: { currency_code: 'USD', value: amount },
                description: `BGRemover - ${credits} credits`,
              },
            ],
          });
        }}
        onApprove={async (_data, actions) => {
          const order = await actions.order!.capture();
          if (order.status === 'COMPLETED') {
            const accessToken = getStoredAccessToken();
            if (!accessToken) {
              console.error('No access token available');
              return;
            }
            await applyPurchasedCredits(
              userSub,
              credits,
              order.id!,
              packName,
              parseFloat(amount),
              userEmail,
              accessToken,
            );
            onSuccess(credits);
          }
        }}
        onError={() => {
          console.error('PayPal payment failed');
          onError?.();
        }}
      />
  );
}
