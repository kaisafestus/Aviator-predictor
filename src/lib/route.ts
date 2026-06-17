import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface PayHeroWebhookPayload {
  transaction_reference: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  phone_number: string;
  CheckoutRequestID?: string;
  ResultCode?: string;
  ResultDesc?: string;
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const payload: PayHeroWebhookPayload = await req.json();
    console.log('Received PayHero webhook:', payload);

    // Extract paymentId from reference (e.g., AVIATOR-uuid)
    const ourTransactionRef = payload.transaction_reference;
    if (!ourTransactionRef || !ourTransactionRef.startsWith('AVIATOR-')) {
      console.error('Invalid transaction_reference:', ourTransactionRef);
      return NextResponse.json({ error: 'Invalid transaction reference' }, { status: 400 });
    }
    const paymentId = ourTransactionRef.replace('AVIATOR-', '');

    let newStatus: 'paid' | 'failed' | 'cancelled' = 'failed';
    
    // PayHero specific success check (usually ResultCode 0 for M-Pesa)
    if (payload.status === 'COMPLETED' || payload.ResultCode === '0') {
      newStatus = 'paid';
    } else if (payload.status === 'CANCELLED') {
      newStatus = 'cancelled';
    }

    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: newStatus,
        provider_response: payload,
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Supabase update error for webhook:', updateError);
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing failed:', error.message);
    return NextResponse.json({ error: 'Failed to process webhook', details: error.message }, { status: 500 });
  }
}