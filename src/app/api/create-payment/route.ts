import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { CreatePaymentRequest, StkPushResponse } from '@/types/payment'
import { payheroStkPush } from '@/lib/payhero'

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


  // PayHero integration — enabled when `PAYHERO_STK_PUSH_URL` and
  // `PAYHERO_BASIC_AUTH_TOKEN` (or other required env vars) are present.
  const payheroStkUrl = process.env.PAYHERO_STK_PUSH_URL
  const payheroAuth = process.env.PAYHERO_BASIC_AUTH_TOKEN

  if (!payheroStkUrl || !payheroAuth) {
    // Not configured: return mock response so frontend can continue
    return NextResponse.json({
      message: 'PayHero not configured. Payment stored as pending.',
      checkoutId,
      provider: 'mock',
    })
  }

  try {
    const stk = await payheroStkPush({
      phone,
      amount,
      checkoutId,
    })

    return NextResponse.json({ checkoutId, stk })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PayHero request failed'
    // Do NOT roll back the DB insert – we keep the payment as pending and
    // surface the error to the frontend for debugging.
    return NextResponse.json({ error: message, checkoutId }, { status: 502 })
  }
}


