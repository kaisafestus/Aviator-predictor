import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { CreatePaymentRequest, StkPushResponse } from '@/types/payment'

export async function POST(req: Request) {
  // Note: This project previously had PayHero disabled. Here we implement the
  // server-side wiring to create a payment record and return a "checkoutId".
  // If PayHero integration keys are not set, we return 501.

  const body = (await req.json().catch(() => ({}))) as CreatePaymentRequest

  const phone = (body.phone || body.PhoneNumber || '').toString().trim()
  const amount = Number((body as { amount?: unknown }).amount ?? 0)



  const packageId = (body.packageId || body.Provider || '').toString().trim()

  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 })
  if (!packageId) return NextResponse.json({ error: 'packageId is required' }, { status: 400 })
  if (!amount || amount <= 0) return NextResponse.json({ error: 'amount is required' }, { status: 400 })

  // Create local payment record first (pending)
  const checkoutId = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
  }

  const { error: insertError } = await supabaseAdmin
    .from('payments')
    .insert({
      phone,
      package_id: packageId,
      amount,
      status: 'pending',
      checkout_id: checkoutId,
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }


  // PayHero integration (placeholder) — enabled only if env vars exist
  const payheroEnabled = Boolean(process.env.PAYHERO_API_KEY)

  if (!payheroEnabled) {
    return NextResponse.json({
      message: 'PayHero not configured. Payment stored as pending.',
      checkoutId,
      provider: 'mock',
    })
  }

  // TODO: Replace this mock with real PayHero STK push / checkout API call.
  // Return the expected payload to your frontend.
  const response: StkPushResponse = {
    CheckoutRequestID: checkoutId,
    ResponseCode: '0',
    ResponseDescription: 'Mock STK push created',
  }


  return NextResponse.json({ checkoutId, stk: response })
}


