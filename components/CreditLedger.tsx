'use client';

import { useState, useEffect, useCallback } from 'react';

interface CreditLedgerEntry {
  id: string;
  userId: string;
  type: 'SIGNUP_BONUS' | 'PURCHASE' | 'SUBSCRIPTION' | 'USAGE' | 'REFUND';
  amount: number;
  balance: number;
  description: string;
  relatedId?: string;
  createdAt: { toMillis: () => number } | string | number;
}

interface CreditLedgerProps {
  userSub: string;
  accessToken: string;
  currentCredits: number | null;
}

const TYPE_CONFIG = {
  SIGNUP_BONUS: { label: '🎁 Signup Bonus', color: 'text-green-600', bg: 'bg-green-50' },
  PURCHASE: { label: '💳 Purchase', color: 'text-blue-600', bg: 'bg-blue-50' },
  SUBSCRIPTION: { label: '🔄 Subscription', color: 'text-purple-600', bg: 'bg-purple-50' },
  USAGE: { label: '✨ Usage', color: 'text-gray-600', bg: 'bg-gray-50' },
  REFUND: { label: '↩️ Refund', color: 'text-orange-600', bg: 'bg-orange-50' },
};

const TYPE_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'SIGNUP_BONUS', label: 'Bonuses' },
  { value: 'PURCHASE', label: 'Purchases' },
  { value: 'SUBSCRIPTION', label: 'Subscriptions' },
  { value: 'USAGE', label: 'Usage' },
  { value: 'REFUND', label: 'Refunds' },
];

export default function CreditLedger({ userSub, accessToken, currentCredits }: CreditLedgerProps) {
  const [entries, setEntries] = useState<CreditLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ totalCredits: number; totalUsed: number; netBalance: number; transactionCount: number } | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d');

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/credit-ledger?userId=${userSub}&limit=100`;
      
      // Calculate date range
      const now = new Date();
      let startDate: Date | null = null;
      if (dateRange === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (dateRange === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (dateRange === '90d') startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      if (startDate) {
        url += `&startDate=${startDate.toISOString()}`;
      }
      
      if (typeFilter) {
        url += `&type=${typeFilter}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries);
        setSummary(data.summary);
      } else {
        setError(data.error || 'Failed to fetch credit ledger');
      }
    } catch (err) {
      setError('Failed to fetch credit ledger');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userSub, accessToken, typeFilter, dateRange]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const formatDate = (timestamp: { toMillis: () => number } | string | number) => {
    let date: Date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp.toMillis === 'function') {
      date = new Date(timestamp.toMillis());
    } else {
      date = new Date();
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return amount > 0 ? `+${amount}` : `${amount}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">📊 Credit History</h3>
          {currentCredits !== null && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Balance</div>
              <div className="text-2xl font-bold text-purple-600">{currentCredits} credits</div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-300 transition-colors"
          >
            {TYPE_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            {(['all', '7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === 'all' ? 'All Time' : range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Total Earned</div>
            <div className="text-xl font-bold text-green-600">+{summary.totalCredits}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Total Used</div>
            <div className="text-xl font-bold text-red-600">-{summary.totalUsed}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Net Balance</div>
            <div className={`text-xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.netBalance >= 0 ? '+' : ''}{summary.netBalance}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Transactions</div>
            <div className="text-xl font-bold text-gray-900">{summary.transactionCount}</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 text-center text-red-600">
          <p>{error}</p>
          <button onClick={fetchLedger} className="mt-2 text-sm text-purple-600 hover:underline">
            Try Again
          </button>
        </div>
      )}

      {/* Entries List */}
      {!loading && !error && entries.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p>No transactions found</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {entries.map((entry) => {
            const config = TYPE_CONFIG[entry.type];
            return (
              <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center text-lg`}>
                      {config.label.split(' ')[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{config.label}</div>
                      <div className="text-sm text-gray-500">{entry.description}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatDate(entry.createdAt)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(entry.amount)}
                    </div>
                    <div className="text-xs text-gray-400">Balance: {entry.balance}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
