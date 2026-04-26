import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('PayHero Webhook:', body)

    // PayHero sends callback data in body.Body.stkCallback
    const stkCallback = body?.Body?.stkCallback
    if (!stkCallback) {
      console.error('Invalid webhook structure:', body)
      return NextResponse.json({ error: 'Invalid webhook structure' }, { status: 400 })
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, Amount, Msisdn } = stkCallback

    // Map PayHero checkout ID to our database checkout_id
    // Note: PayHero uses CheckoutRequestID which maps to our checkout_id
    const checkoutId = CheckoutRequestID

    if (ResultCode === 0) {
      // Success - update payment to paid
      console.log(`✅ Payment confirmed: ${checkoutId} KSH${Amount} from ${Msisdn}`)

      const { error: updateError } = await getSupabaseAdmin()
        .from('payments')
        .update({
          status: 'paid',
          result_code: String(ResultCode),
          result_desc: ResultDesc
        })
        .eq('checkout_id', checkoutId)

      if (updateError) {
        console.error('Supabase update error:', updateError)
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success - DB update failed' })
      }

      console.log(`💾 Payment ${checkoutId} marked as PAID in Supabase`)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
    } else {
      // Payment failed
      console.log(`❌ Payment failed: ${checkoutId} - ${ResultDesc}`)

      await getSupabaseAdmin()
        .from('payments')
        .update({
          status: 'failed',
          result_code: String(ResultCode),
          result_desc: ResultDesc
        })
        .eq('checkout_id', checkoutId)

      return NextResponse.json({ ResultCode: 1037, ResultDesc: 'Failed' })
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }
}

// GET for PayHero callback verification
export async function GET() {
  return NextResponse.json({ status: 'OK', message: 'Webhook ready' })
}

