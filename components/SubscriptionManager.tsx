'use client';

import { useState, useEffect, useCallback } from 'react';

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  creditsPerMonth: number;
  startDate: { toDate: () => Date };
  nextBilling?: { toDate: () => Date };
  paypalSubscriptionId?: string;
  cancelledAt?: { toDate: () => Date };
}

interface SubscriptionManagerProps {
  userSub: string;
  accessToken: string;
  onSubscriptionChange?: () => void;
  onSubscriptionStatusChange?: (hasActiveSubscription: boolean) => void;
}



export default function SubscriptionManager({ userSub, accessToken, onSubscriptionChange, onSubscriptionStatusChange }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Notify parent of subscription status
  useEffect(() => {
    onSubscriptionStatusChange?.(subscription !== null && subscription.status === 'ACTIVE');
  }, [subscription, onSubscriptionStatusChange]);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscription?userId=${userSub}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSubscription(data.subscription);
      } else {
        setError(data.error || 'Failed to fetch subscription');
      }
    } catch (err) {
      setError('Failed to fetch subscription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userSub, accessToken]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) return;
    
    setError(null);

    try {
      const res = await fetch('/api/subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          paypalSubscriptionId: subscription.paypalSubscriptionId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Subscription cancelled successfully. You can use until the end of billing period.');
        fetchSubscription();
        onSubscriptionChange?.();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">● Active</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">● Cancelled</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">● Expired</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
        <div className="text-5xl mb-4">💎</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Subscription</h3>
        <p className="text-gray-500 mb-6">Subscribe to get monthly credits at a lower price</p>
        <p className="text-sm text-gray-400">Select a plan above to subscribe</p>
      </div>
    );
  }

  const nextBillingDate = subscription.nextBilling ? subscription.nextBilling.toDate().toLocaleDateString() : 'N/A';
  const startDate = subscription.startDate ? subscription.startDate.toDate().toLocaleDateString() : 'N/A';

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
          {successMsg}
        </div>
      )}

      {/* Current Subscription Card */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{subscription.planName} Plan</h3>
            <div className="flex items-center gap-2">{getStatusBadge(subscription.status)}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{subscription.creditsPerMonth}</div>
            <div className="text-sm text-purple-200">credits/month</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div>
            <div className="text-sm text-purple-200">Next Billing</div>
            <div className="font-semibold">{nextBillingDate}</div>
          </div>
          <div>
            <div className="text-sm text-purple-200">Started</div>
            <div className="font-semibold">{startDate}</div>
          </div>
        </div>

        {subscription.status === 'ACTIVE' && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <button
              onClick={handleCancelSubscription}
              className="w-full px-4 py-2.5 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors text-sm"
            >
              ✕ Cancel Subscription
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
