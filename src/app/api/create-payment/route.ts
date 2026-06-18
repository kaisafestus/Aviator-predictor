import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { initiateStkPush } from '@/lib/payhero'
import type { CreatePaymentRequest } from '@/types/payment'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as CreatePaymentRequest

  const phone = (body.phone || body.PhoneNumber || '').toString().trim()
  const amount = Number((body as { amount?: unknown }).amount ?? 0)
  const packageId = (body.packageId || body.Provider || '').toString().trim()

  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 })
  if (!packageId) return NextResponse.json({ error: 'packageId is required' }, { status: 400 })
  if (!amount || amount <= 0) return NextResponse.json({ error: 'amount is required' }, { status: 400 })

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
  }

  // Insert a pending payment record first to get the UUID we'll use as external_reference
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('payments')
    .insert({
      phone,
      package_id: packageId,
      amount,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message || 'Failed to create payment record' }, { status: 500 })
  }

  const paymentId = inserted.id
  // Use a prefix PayHero webhook can recognise
  const externalReference = `AVIATOR-${paymentId}`

  // Initiate M-Pesa STK Push
  const stkResult = await initiateStkPush(phone, amount, externalReference)

  if (!stkResult.success) {
    // Mark the record as failed and surface the error to the client
    await supabaseAdmin
      .from('payments')
      .update({ status: 'failed', provider_response: { error: stkResult.error, raw: stkResult.raw } })
      .eq('id', paymentId)

    return NextResponse.json(
      { error: stkResult.error || 'Failed to initiate M-Pesa payment' },
      { status: 502 }
    )
  }

  // Store the PayHero CheckoutRequestID so the webhook can match it
  await supabaseAdmin
    .from('payments')
    .update({
      checkout_id: stkResult.checkoutId,
      provider_response: stkResult.raw,
    })
    .eq('id', paymentId)

  return NextResponse.json({
    checkoutId: stkResult.checkoutId || externalReference,
    paymentId,
    status: 'pending',
    message: 'STK Push sent. Check your phone and enter your M-Pesa PIN.',
  })
}
