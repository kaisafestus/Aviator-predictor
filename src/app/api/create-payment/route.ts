import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const packagePrices = {
  basic: 100,
  pro: 500,
  vip: 2000
}

const packageDurations = {
  basic: 30,
  pro: 120,
  vip: 1440
}

export async function POST(req: NextRequest) {
  try {
    const { phone, packageId } = await req.json()

    if (!phone || !packageId) {
      return NextResponse.json({ error: 'Missing phone or package ID' }, { status: 400 })
    }

    const amount = packagePrices[packageId as keyof typeof packagePrices]

    if (!amount) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const checkoutId = `CHK_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const { error: dbError } = await getSupabaseAdmin()
      .from('payments')
      .insert({
        phone,
        package_id: packageId,
        amount,
        status: 'pending',
        checkout_id: checkoutId
      })

    if (dbError) {
      console.error('Supabase insert error:', dbError)
      return NextResponse.json({ error: 'Failed to create payment record', details: dbError.message, code: dbError.code }, { status: 500 })
    }

    console.log(`💾 Payment saved: ${phone} | ${packageId} | KSH ${amount} | ${checkoutId}`)

    const baseUrl = process.env.NEXT_PUBLIC_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/webhook`

    const authHeader = process.env.PAYHERO_TOKEN?.startsWith('Basic ')
      ? process.env.PAYHERO_TOKEN
      : `Bearer ${process.env.PAYHERO_TOKEN}`

    const stkResponse = await fetch('https://api.payhero.co.ke/v1/stkpush', {
      method: 'POST',
      headers: {
        'Authorization': authHeader!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        PhoneNumber: `254${phone.slice(-9)}`,
        Amount: amount,
        AccountReference: 'AviatorSignals',
        AccountID: process.env.PAYHERO_ACCOUNT_ID,
        ChannelID: process.env.PAYHERO_CHANNEL_ID,
        TransactionDesc: `Signals ${packageId}`,
        CallbackUrl: callbackUrl
      })
    })

    const stkData = await stkResponse.json()

    const payHeroCheckoutId = stkData.CheckoutRequestID
    if (payHeroCheckoutId && payHeroCheckoutId !== checkoutId) {
      await getSupabaseAdmin()
        .from('payments')
        .update({ checkout_id: payHeroCheckoutId })
        .eq('checkout_id', checkoutId)
      console.log(`🔗 Checkout ID updated: ${checkoutId} → ${payHeroCheckoutId}`)
    }

    if (stkData.ResponseCode !== '0') {
      await getSupabaseAdmin()
        .from('payments')
        .update({ status: 'failed', result_desc: stkData.ResponseDescription })
        .eq('checkout_id', payHeroCheckoutId || checkoutId)

      throw new Error(stkData.ResponseDescription)
    }

    console.log(`📱 PayHero STK → ${phone} KSH${amount} | Callback: ${callbackUrl}`)

    return NextResponse.json({
      success: true,
      checkoutId,
      message: `PayHero STK sent to ${phone}! Enter PIN. ID: ${checkoutId}`
    })

  } catch (error) {
    console.error('PayHero error:', error)
    return NextResponse.json({ error: 'STK failed - check phone' }, { status: 500 })
  }
}
