import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  return NextResponse.json({ status: 'OK', message: 'Webhook ready' })
}

export async function POST(req: Request) {
  // PayHero webhook handling should:
  // - validate signature (if supported)
  // - read checkout/transaction id + result
  // - mark payments.status to paid/failed
  // For now, implement a minimal handler that accepts JSON:
  // { checkoutId: string, status: 'paid' | 'failed' }

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const checkoutId = ((payload.checkoutId ?? payload.CheckoutRequestID) ?? '').toString()
  const statusRaw = ((payload.status ?? payload.paymentStatus) ?? '').toString().toLowerCase()


  if (!checkoutId) return NextResponse.json({ error: 'checkoutId is required' }, { status: 400 })

  const status = statusRaw === 'paid' ? 'paid' : statusRaw === 'failed' ? 'failed' : 'paid'

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
  }

  const { error } = await supabaseAdmin
    .from('payments')
    .update({ status })
    .eq('checkout_id', checkoutId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })


  return NextResponse.json({ ok: true, checkoutId, status })
}


