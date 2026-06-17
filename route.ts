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
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });
    }

    const { phone, packageId, amount }: CreatePaymentRequestBody = await req.json();

    if (!phone || !packageId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Strict M-Pesa formatting (2547XXXXXXXX or 2541XXXXXXXX)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone;
    }

    if (!formattedPhone.match(/^254[71]\d{8}$/)) {
      return NextResponse.json({ error: 'Please enter a valid M-Pesa number (e.g. 0712345678)' }, { status: 400 });
    }

    // 1. Create one specific record in Supabase
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
      return NextResponse.json({ error: 'Database error', details: insertError?.message }, { status: 500 });
    }

    const paymentId = payment.id;

    // 2. Prepare PayHero v2 Payload
    const payheroUrl = process.env.PAYHERO_STK_PUSH_URL;
    const authToken = process.env.PAYHERO_AUTH_TOKEN;
    const serviceId = process.env.PAYHERO_SERVICE_ID;
    const channelId = process.env.PAYHERO_CHANNEL_ID;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;

    if (!payheroUrl || !authToken || !serviceId || !channelId) {
      return NextResponse.json({ error: 'PayHero configuration missing on server' }, { status: 500 });
    }

    const callbackUrl = `${appBaseUrl}/api/webhook`;

    const payheroPayload = {
      amount: Math.round(amount),
      phone_number: formattedPhone,
      channel_id: parseInt(channelId),
      service_id: parseInt(serviceId),
      external_reference: `AVIATOR-${paymentId}`,
      callback_url: callbackUrl
    };

    // 3. Trigger the STK Push
    const payheroResponse = await axios.post(payheroUrl, payheroPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      }
    });

    const payheroData = payheroResponse.data;
    const payheroTransactionId = payheroData.CheckoutRequestID || payheroData.checkout_id || payheroData.transaction_id;

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