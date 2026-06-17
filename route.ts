import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin'; // Assuming this path
import axios from 'axios'; // For making HTTP requests to PayHero

// Define the shape of the request body
interface CreatePaymentRequestBody {
  phone: string;
  packageId: string;
  amount: number;
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });
    }

    const { phone, packageId, amount }: CreatePaymentRequestBody = await req.json();

    // 1. Validate input
    if (!phone || !packageId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Ensure phone number is in a valid format for M-Pesa (e.g., 2547...)
    const formattedPhone = phone.startsWith('0') ? `254${phone.substring(1)}` : phone;
    if (!formattedPhone.match(/^2547\d{8}$/)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // 2. Insert a pending payment record into Supabase
    const { data: payment, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_phone: formattedPhone,
        package_id: packageId,
        amount: amount,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !payment) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    const paymentId = payment.id; // Get the ID of the newly created payment record

    // 3. Call PayHero STK Push API
    const payheroApiKey = process.env.PAYHERO_API_KEY;
    const payheroApiSecret = process.env.PAYHERO_API_SECRET;
    const payheroStkPushUrl = process.env.PAYHERO_STK_PUSH_URL;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL; // Used to construct callback URL

    if (!payheroApiKey || !payheroApiSecret || !payheroStkPushUrl || !appBaseUrl) {
      console.error('Missing PayHero environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const callbackUrl = `${appBaseUrl}/api/webhook`; // PayHero will call this endpoint

    // PayHero STK Push request payload (adjust based on actual PayHero API docs)
    const payheroPayload = {
      phone_number: formattedPhone,
      amount: amount,
      transaction_reference: `AVIATOR-${paymentId}`, // Use our payment ID as reference
      callback_url: callbackUrl,
      // Add any other required PayHero parameters like account_reference, description etc.
      api_key: payheroApiKey, // Some APIs require key in payload, others in headers
      api_secret: payheroApiSecret, // Some APIs require secret in payload, others in headers
    };

    const payheroHeaders = {
      'Content-Type': 'application/json',
      // Authorization: `Bearer ${Buffer.from(`${payheroApiKey}:${payheroApiSecret}`).toString('base64')}`, // Example for basic auth
      // Add any other required headers for PayHero
    };

    const payheroResponse = await axios.post(payheroStkPushUrl, payheroPayload, { headers: payheroHeaders });

    // 4. Handle PayHero response and update Supabase
    const payheroData = payheroResponse.data;
    const payheroTransactionId = payheroData.transaction_id || payheroData.CheckoutRequestID; // Adjust based on actual PayHero response

    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        payhero_transaction_id: payheroTransactionId,
        provider_response: payheroData, // Store full response for debugging
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Supabase update error after PayHero call:', updateError);
      // Log this error but still return success if STK push was initiated
    }

    // 5. Return success response to frontend
    return NextResponse.json({
      message: 'Payment initiated successfully. Check your phone for STK push.',
      paymentId: paymentId,
      payheroTransactionId: payheroTransactionId,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Payment initiation failed:', error.message, error.response?.data);
    return NextResponse.json({ error: 'Failed to initiate payment', details: error.message }, { status: 500 });
  }
}