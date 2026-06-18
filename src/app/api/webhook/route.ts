import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  return NextResponse.json({ status: 'OK', message: 'Webhook ready' })
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase admin not configured')

    const payload = await req.json()
    console.log('PayHero Webhook payload:', JSON.stringify(payload))

    // PayHero sends the reference we passed as external_reference
    const reference: string =
      payload.external_reference ||
      payload.TransactionReference ||
      payload.external_id ||
      ''

    const statusRaw = (payload.Status || '').toString().toLowerCase()
    const resultCode = payload.ResultCode?.toString()

    if (!reference.startsWith('AVIATOR-')) {
      // Not our payment — ignore gracefully
      return NextResponse.json({ ok: true, note: 'unrecognised reference' })
    }

    const paymentId = reference.replace('AVIATOR-', '')

    let finalStatus: 'paid' | 'failed' | 'cancelled' = 'failed'
    if (statusRaw === 'success' || resultCode === '0' || statusRaw === 'completed') {
      finalStatus = 'paid'
    } else if (statusRaw === 'cancelled') {
      finalStatus = 'cancelled'
    }

    if (finalStatus === 'paid') {
      // Look up the package to calculate expiry
      const { data: payment, error: fetchErr } = await supabaseAdmin
        .from('payments')
        .select('package_id')
        .eq('id', paymentId)
        .single()

      if (fetchErr || !payment) {
        console.error('Webhook: payment not found for id', paymentId, fetchErr)
        return NextResponse.json({ ok: false, error: 'payment not found' }, { status: 404 })
      }

      const { data: pkg, error: pkgErr } = await supabaseAdmin
        .from('packages')
        .select('duration_minutes')
        .eq('id', payment.package_id)
        .single()

      if (pkgErr || !pkg) {
        console.error('Webhook: package not found', payment.package_id, pkgErr)
        return NextResponse.json({ ok: false, error: 'package not found' }, { status: 404 })
      }

      const expiresAt = new Date(Date.now() + pkg.duration_minutes * 60 * 1000).toISOString()

      const { error: updateErr } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'paid',
          expires_at: expiresAt,
          provider_response: payload,
          payhero_transaction_id:
            payload.TransactionCode ||
            payload.MpesaReceiptNumber ||
            payload.transaction_id ||
            null,
        })
        .eq('id', paymentId)

      if (updateErr) console.error('Webhook DB update error:', updateErr)
    } else {
      const { error: updateErr } = await supabaseAdmin
        .from('payments')
        .update({
          status: finalStatus,
          provider_response: payload,
        })
        .eq('id', paymentId)

      if (updateErr) console.error('Webhook DB update error:', updateErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
