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
  const body = await req.json()
  console.log('RECEIVED BODY:', body);
  
  const { phone, PhoneNumber, Amount, Provider, packageId } = body
  
  if (!phone && !PhoneNumber) {
    return NextResponse.json({ error: 'Missing phone or PhoneNumber' }, { status: 400 })
  }
  
  if (!packageId && !Amount) {
    return NextResponse.json({ error: 'Missing packageId or Amount' }, { status: 400 })
  }

  console.log("PACKAGE RECEIVED:", packageId);
  const amount = packagePrices[packageId as keyof typeof packagePrices] || Amount

    if (!amount) {
      return NextResponse.json({ error: 'Invalid package - ' + packageId }, { status: 400 })
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

    // Verify environment variables
    const payHeroToken = process.env.PAYHERO_TOKEN
    const payHeroAccountId = process.env.PAYHERO_ACCOUNT_ID
    const payHeroChannelId = process.env.PAYHERO_CHANNEL_ID

    console.log('🔑 PayHero Config Check:', {
      hasToken: !!payHeroToken,
      tokenPreview: payHeroToken ? payHeroToken.substring(0, 15) + '...' : 'NOT SET',
      hasAccountId: !!payHeroAccountId,
      hasChannelId: !!payHeroChannelId
    })

    if (!payHeroToken || !payHeroAccountId || !payHeroChannelId) {
      console.error('❌ Missing PayHero config:', {
        hasToken: !!payHeroToken,
        hasAccountId: !!payHeroAccountId,
        hasChannelId: !!payHeroChannelId
      })
      return NextResponse.json(
        { error: 'Payment configuration missing - contact admin', hint: 'Add PAYHERO_TOKEN, PAYHERO_ACCOUNT_ID, PAYHERO_CHANNEL_ID to .env.local' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/webhook`

    // Format phone correctly - ensure 2547... format
    const phoneDigits = phone.replace(/\D/g, '')
    const formattedPhone = phoneDigits.startsWith('254')
      ? phoneDigits
      : phoneDigits.startsWith('7') || phoneDigits.startsWith('1')
        ? `254${phoneDigits}`
        : phoneDigits

    console.log('📱 STK Request:', {
      phone: formattedPhone,
      amount,
      packageId,
      checkoutId,
      callbackUrl,
      accountId: payHeroAccountId,
      channelId: payHeroChannelId
    })

    // PayHero API - use Basic auth format
    const authHeader = payHeroToken.startsWith('Basic ')
      ? payHeroToken
      : `Basic ${payHeroToken}`

    console.log('📤 Sending PayHero STK Request...')
    console.log('   Request payload:', JSON.stringify({
      APIPaymentForm: {
        PhoneNumber: formattedPhone,
        Amount: amount,
        Provider: 'MPESA',
        AccountReference: 'AviatorSignals',
        AccountID: payHeroAccountId,
        ChannelID: payHeroChannelId,
        TransactionDesc: `Aviator ${packageId} Package`,
        CallbackUrl: callbackUrl
      }
    }, null, 2))

    const stkResponse = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Amount: amount,
        PhoneNumber: formattedPhone,
        Provider: "m-pesa"
      })
    })

    const stkData = await stkResponse.json()
    console.log('📥 PayHero Response:', JSON.stringify(stkData, null, 2))

    const payHeroCheckoutId = stkData.CheckoutRequestID
    if (payHeroCheckoutId && payHeroCheckoutId !== checkoutId) {
      await getSupabaseAdmin()
        .from('payments')
        .update({ checkout_id: payHeroCheckoutId })
        .eq('checkout_id', checkoutId)
      console.log(`🔗 Checkout ID updated: ${checkoutId} → ${payHeroCheckoutId}`)
    }

    if (stkData.ResponseCode !== '0') {
      const errorMsg = stkData.ResponseDescription || 'Unknown PayHero error'
      console.error('❌ PayHero error:', {
        code: stkData.ResponseCode,
        description: errorMsg,
        fullResponse: stkData
      })
      await getSupabaseAdmin()
        .from('payments')
        .update({ status: 'failed', result_desc: errorMsg })
        .eq('checkout_id', payHeroCheckoutId || checkoutId)

      return NextResponse.json({
        error: `Payment failed: ${errorMsg}`,
        details: stkData,
        hint: stkData.ResponseCode === '1000' ? 'Check phone number format (2547xxxxxxxx)' : undefined
      }, { status: 400 })
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
