import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  return NextResponse.json({ status: 'OK', message: 'Webhook ready' })
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase admin not configured');

    const payload = await req.json();
    console.log('PayHero Webhook:', payload);

    // PayHero sends reference in external_reference or TransactionReference
    const reference = payload.external_reference || payload.TransactionReference || payload.external_id;
    const statusRaw = (payload.Status || '').toString().toLowerCase();
    const resultCode = payload.ResultCode?.toString(); // '0' is success for M-Pesa
    const responseDescription = payload.ResultDesc || payload.Description;

    if (reference && reference.startsWith('AVIATOR-')) {
      const paymentId = reference.replace('AVIATOR-', '');
      
      let finalStatus: 'paid' | 'failed' | 'cancelled' = 'failed';
      
      if (statusRaw === 'success' || resultCode === '0' || statusRaw === 'completed') {
        finalStatus = 'paid';
      } else if (statusRaw === 'cancelled') {
        finalStatus = 'cancelled';
      }

      const { error } = await supabaseAdmin
        .from('payments')
        .update({ 
          status: finalStatus, 
          provider_response: payload 
        })
        .eq('id', paymentId);

      if (error) console.error('Webhook DB Update Error:', error);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
