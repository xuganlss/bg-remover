import { NextRequest, NextResponse } from 'next/server';
import { docRef, getDoc, updateDoc, serverTimestamp, createDoc } from '@/lib/firebase';

// Get user's active subscription
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
    
    // Get user's subscription from Firestore
    // Note: In production, you'd query the subscriptions collection with userId filter
    // For now, we'll return mock data structure
    const subscriptionRef = docRef('subscriptions', userId);
    const snap = await getDoc(subscriptionRef, accessToken);
    
    if (!snap.exists()) {
      return NextResponse.json({ subscription: null });
    }
    
    const subscription = snap.data();
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

// Create subscription
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.substring(7);
    
    const body = await request.json();
    const { userId, planId, planName, paypalSubscriptionId, status, creditsPerMonth } = body;
    
    if (!userId || !planId || !planName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create subscription record in Firestore
    const subscriptionId = await createDoc('subscriptions', {
      userId,
      planId,
      planName,
      status: status || 'ACTIVE',
      creditsPerMonth,
      paypalSubscriptionId,
      startDate: serverTimestamp(),
      nextBilling: serverTimestamp(), // Will be updated by PayPal webhook
      modifiedAt: serverTimestamp(),
    }, accessToken);
    
    // Add subscription credits to user
    const userRef = docRef('users', userId);
    const userSnap = await getDoc(userRef, accessToken);
    const currentCredits = userSnap.exists() ? (userSnap.data().credits as number) || 0 : 0;
    
    await updateDoc(userRef, {
      credits: currentCredits + creditsPerMonth,
      plan: planName.toLowerCase(),
      modifiedAt: serverTimestamp(),
    }, accessToken);
    
    // Create credit ledger entry
    await createDoc('creditLedger', {
      userId,
      type: 'SUBSCRIPTION',
      amount: creditsPerMonth,
      balance: currentCredits + creditsPerMonth,
      description: `${planName} plan subscription`,
      relatedId: subscriptionId,
      createdAt: serverTimestamp(),
    }, accessToken);
    
    return NextResponse.json({ 
      success: true, 
      subscriptionId,
      message: `Successfully subscribed to ${planName} plan with ${creditsPerMonth} credits` 
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.substring(7);
    
    const body = await request.json();
    const { subscriptionId, paypalSubscriptionId } = body;
    
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }
    
    // Update Firestore subscription status
    const subscriptionRef = docRef('subscriptions', subscriptionId);
    await updateDoc(subscriptionRef, {
      status: 'CANCELLED',
      modifiedAt: serverTimestamp(),
      cancelledAt: serverTimestamp(),
    }, accessToken);
    
    // Note: In production, you'd also call PayPal API to cancel the subscription
    // POST https://api-m.sandbox.paypal.com/v1/billing/subscriptions/{id}/cancel
    
    return NextResponse.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
