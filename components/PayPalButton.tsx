'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PAYPAL_CLIENT_ID = 'AcAPfiyzUv1hoJvvkAnBQJ8mGLOySzXm46KYu3lalmatqbPye-FsxEq1kVt-2YZRUBvhV65UCfdlWRI5';

interface PayPalButtonProps {
  amount: string;       // e.g. "4.99"
  credits: number;      // e.g. 10
  userSub: string;      // Firestore user doc ID
  onSuccess: (credits: number) => void;
  onError?: () => void;
}

export default function PayPalButton({ amount, credits, userSub, onSuccess, onError }: PayPalButtonProps) {
  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'pay' }}
        createOrder={(_data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: 'USD',
                  value: amount,
                },
                description: `BGRemover - ${credits} credits`,
              },
            ],
          });
        }}
        onApprove={async (_data, actions) => {
          const order = await actions.order!.capture();
          if (order.status === 'COMPLETED') {
            // 给用户加积分
            const ref = doc(db, 'users', userSub);
            await updateDoc(ref, { credits: increment(credits) });
            onSuccess(credits);
          }
        }}
        onError={() => {
          console.error('PayPal payment failed');
          onError?.();
        }}
      />
    </PayPalScriptProvider>
  );
}
