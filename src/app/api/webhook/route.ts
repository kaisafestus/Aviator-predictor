import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  return NextResponse.json({ status: 'OK', message: 'Webhook ready' })
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('PayHero Webhook:', payload);

    const reference = payload.external_reference || payload.TransactionReference;
    const statusRaw = (payload.Status || '').toString().toLowerCase();
    const resultCode = payload.ResultCode?.toString();

    if (reference && reference.startsWith('AVIATOR-')) {
      const paymentId = reference.replace('AVIATOR-', '');
      const isSuccess = statusRaw === 'success' || resultCode === '0';
      const finalStatus = isSuccess ? 'paid' : 'failed';

      await supabaseAdmin
        ?.from('payments')
        .update({ status: finalStatus, provider_response: payload })
        .eq('id', paymentId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
