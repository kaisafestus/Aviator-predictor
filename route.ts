import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin'; // Assuming this path

// Define the shape of the PayHero webhook payload (adjust based on actual PayHero docs)
interface PayHeroWebhookPayload {
  transaction_reference: string; // This should match AVIATOR-{paymentId}
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED'; // Or similar statuses
  amount: number;
  phone_number: string;
  // Add any other relevant fields from PayHero's callback
  CheckoutRequestID?: string; // M-Pesa specific
  ResultCode?: string;
  ResultDesc?: string;
  MerchantRequestID?: string;
}

export async function POST(req: Request) {
  try {
    const payheroWebhookSecret = process.env.PAYHERO_WEBHOOK_SECRET;
    // 1. Validate incoming request (e.g., check for a shared secret or signature)
    // This is a placeholder. PayHero might send a header or a field in the body for verification.
    // Example: if PayHero sends a 'X-Payhero-Signature' header, you'd verify it here.
    // For simplicity, we'll assume a basic secret check if provided by PayHero, or skip for now.
    // const signature = req.headers.get('X-Payhero-Signature');
    // if (!verifyPayheroSignature(req.body, signature, payheroWebhookSecret)) {
    //   return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    // }

    const payload: PayHeroWebhookPayload = await req.json();
    console.log('Received PayHero webhook:', payload);

    // Extract our paymentId from the transaction_reference
    const ourTransactionRef = payload.transaction_reference;
    if (!ourTransactionRef || !ourTransactionRef.startsWith('AVIATOR-')) {
      console.error('Invalid transaction_reference in webhook:', ourTransactionRef);
      return NextResponse.json({ error: 'Invalid transaction reference' }, { status: 400 });
    }
    const paymentId = ourTransactionRef.replace('AVIATOR-', '');

    let newStatus: 'paid' | 'failed' | 'cancelled' = 'failed'; // Default to failed
    if (payload.status === 'COMPLETED' || payload.ResultCode === '0') { // Adjust based on actual PayHero success indicator
      newStatus = 'paid';
    } else if (payload.status === 'CANCELLED') {
      newStatus = 'cancelled';
    }

    // 2. Update the payment status in Supabase
    const { data, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: newStatus,
        provider_response: payload, // Store full webhook payload
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error for webhook:', updateError);
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
    }

    console.log(`Payment ${paymentId} updated to status: ${newStatus}`);
    return NextResponse.json({ message: 'Webhook received and processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing failed:', error.message);
    return NextResponse.json({ error: 'Failed to process webhook', details: error.message }, { status: 500 });
  }
}