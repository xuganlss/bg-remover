import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from '@/lib/firebase';

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  type: 'SIGNUP_BONUS' | 'PURCHASE' | 'SUBSCRIPTION' | 'USAGE' | 'REFUND';
  amount: number;
  balance: number;
  description: string;
  relatedId?: string;
  createdAt: Timestamp | string;
}

// Helper to convert createdAt to milliseconds
function toMillis(timestamp: Timestamp | string | number): number {
  if (typeof timestamp === 'string') {
    return new Date(timestamp).getTime();
  } else if (typeof timestamp === 'number') {
    return timestamp;
  } else if (typeof timestamp.toMillis === 'function') {
    return (timestamp as Timestamp).toMillis();
  }
  return Date.now();
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.substring(7);
    
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const limitParam = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const type = request.nextUrl.searchParams.get('type');
    
    // Build query
    let q = query(
      collection('creditLedger'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitParam)
    );
    
    // Note: Firestore REST API has limitations on complex queries
    // For production, you'd use Firebase Admin SDK or cloud functions
    
    const querySnapshot = await getDocs(q, accessToken);
    const entries: CreditLedgerEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data(),
      } as CreditLedgerEntry);
    });
    
    // Filter by date range and type on client side if needed
    let filtered = entries;
    if (startDate) {
      const startTs = new Date(startDate).getTime();
      filtered = filtered.filter(e => toMillis(e.createdAt) >= startTs);
    }
    if (endDate) {
      const endTs = new Date(endDate).getTime();
      filtered = filtered.filter(e => toMillis(e.createdAt) <= endTs);
    }
    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }
    
    // Calculate totals
    const totalCredits = filtered
      .filter(e => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalUsed = filtered
      .filter(e => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    
    return NextResponse.json({
      entries: filtered,
      summary: {
        totalCredits,
        totalUsed,
        netBalance: totalCredits - totalUsed,
        transactionCount: filtered.length,
      },
    });
  } catch (error) {
    console.error('Error fetching credit ledger:', error);
    return NextResponse.json({ error: 'Failed to fetch credit ledger' }, { status: 500 });
  }
}
