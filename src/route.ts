import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import axios from 'axios'; // For making HTTP requests to PayHero

// Define the shape of the request body
interface CreatePaymentRequestBody {
  phone: string;
  packageId: string;
  amount: number;
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase admin not configured');

    const { phone, packageId, amount }: CreatePaymentRequestBody = await req.json();

    if (!phone || !packageId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Format phone to 254...
    const formattedPhone = phone.startsWith('0') 
      ? `254${phone.substring(1)}` 
      : phone.startsWith('+') ? phone.substring(1) : phone;

    // 1. Insert pending payment record
    const { data: payment, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        phone: formattedPhone,
        package_id: packageId,
        amount: amount,
        status: 'pending',
      })
      .select()
      .single();
    
    if (insertError || !payment) {
      return NextResponse.json({ error: insertError?.message }, { status: 500 });
    }

    const paymentId = payment.id;

    // 2. Prepare PayHero STK Push
    const payheroUrl = process.env.PAYHERO_STK_PUSH_URL;
    const authToken = process.env.PAYHERO_AUTH_TOKEN;
    const serviceId = process.env.PAYHERO_SERVICE_ID;
    const channelId = process.env.PAYHERO_CHANNEL_ID;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;

    if (!payheroUrl || !authToken || !serviceId || !channelId) {
      throw new Error('PayHero credentials missing');
    }

    const callbackUrl = `${appBaseUrl}/api/webhook`;

    const payheroPayload = {
      amount,
      phone_number: formattedPhone,
      channel_id: parseInt(channelId),
      service_id: parseInt(serviceId),
      external_reference: `AVIATOR-${paymentId}`,
      callback_url: callbackUrl
    };

    const payheroResponse = await axios.post(payheroUrl, payheroPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      }
    });

    // 3. Update record with PayHero checkout ID
    const payheroData = payheroResponse.data;
    const payheroTransactionId = payheroData.CheckoutRequestID || payheroData.checkout_id;

    await supabaseAdmin
      .from('payments')
      .update({
        payhero_transaction_id: payheroTransactionId,
        provider_response: payheroData,
      })
      .eq('id', paymentId);

    return NextResponse.json({
      message: 'STK push sent successfully',
      paymentId: paymentId,
      payheroTransactionId: payheroTransactionId,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Payment initiation failed:', error.message, error.response?.data);
    return NextResponse.json({ error: 'Failed to initiate payment', details: error.message }, { status: 500 });
  }
}