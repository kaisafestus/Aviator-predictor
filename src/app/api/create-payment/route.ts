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

interface CreatePaymentRequest {
  phone?: string
  PhoneNumber?: string
  Amount?: number
  packageId?: string
  Provider?: string
}

function validateAndNormalizePhone(phoneInput: string | undefined): { valid: false; error: string } | { valid: true; phone: string } {
  if (!phoneInput || typeof phoneInput !== 'string') {
    return { valid: false, error: 'Phone is required' }
  }

  const trimmed = phoneInput.trim()
  if (trimmed.length < 10 || trimmed.length > 15) {
    return { valid: false, error: 'Phone must be 10-15 digits (e.g., 0712345678 or 254712345678)' }
  }

  // Extract digits
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 9) {
    return { valid: false, error: 'Invalid phone number - too few digits' }
  }

  // Normalize to 254 format
  let normalized: string
  if (digits.startsWith('254')) {
    normalized = digits
  } else if (digits.startsWith('0')) {
    normalized = '254' + digits.slice(1)
  } else if (digits.startsWith('7') || digits.startsWith('1')) {
    normalized = '254' + digits
  } else {
    return { valid: false, error: 'Phone must start with 07/1 (MPESA) or be full international 254' }
  }

  if (normalized.length !== 12 || !normalized.startsWith('2547') && !normalized.startsWith('2541')) {
    return { valid: false, error: 'Invalid Kenyan MPESA number format. Use 2547xxxxxxxx or 2541xxxxxxxx' }
  }

  return { valid: true, phone: normalized }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreatePaymentRequest
    console.log('📥 RECEIVED BODY:', JSON.stringify(body, null, 2))
    console.log('🔍 RAW HEADERS:', Object.fromEntries(req.headers.entries()))


    const { phone, PhoneNumber, Amount, packageId, Provider } = body || {}
    if (!body) {
      console.error('🚨 EMPTY BODY - Parsing failed!')
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }


    // Step 1: Strict phone validation FIRST
    const finalPhoneResult = validateAndNormalizePhone(phone || PhoneNumber)
    if (!finalPhoneResult.valid) {
      console.log('❌ Phone validation failed:', finalPhoneResult.error)
      return NextResponse.json({ error: finalPhoneResult.error }, { status: 400 })
    }
    const validatedPhone = finalPhoneResult.phone!
    console.log('✅ Validated phone:', validatedPhone)
    
    // 🔥 CRITICAL: Final null-safety check
    if (!validatedPhone) {
      console.error('💥 VALIDATION PASSED BUT PHONE STILL NULL!', { phone, PhoneNumber, validatedPhone })
      return NextResponse.json({ error: 'Internal validation error - phone missing' }, { status: 500 })
    }


    // Step 2: Amount validation
    const amountFromPackage = packagePrices[(packageId || 'basic') as keyof typeof packagePrices]
    const amount = amountFromPackage || Amount
    if (!amount || amount < 50 || amount > 5000) {
      return NextResponse.json({ 
        error: `Invalid amount: ${amount}. Valid packages: basic(100), pro(500), vip(2000)`,
        packageId,
        Amount 
      }, { status: 400 })
    }
    console.log('✅ Valid amount:', amount)

    // Step 3: Generate checkout ID
    const checkoutId = `CHK_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Step 4: PayHero env check
    const payHeroToken = process.env.PAYHERO_TOKEN
    const payHeroAccountId = process.env.PAYHERO_ACCOUNT_ID
    const payHeroChannelId = process.env.PAYHERO_CHANNEL_ID

    if (!payHeroToken || !payHeroAccountId || !payHeroChannelId) {
      console.error('❌ Missing PayHero config')
      return NextResponse.json(
        { error: 'Payment service unavailable - contact admin' },
        { status: 503 }
      )
    }

    // 🔥 Step 5: DB Insert with FULL DEBUG LOGGING
    const insertData = {
      phone: validatedPhone,
      package_id: packageId || 'basic',
      amount: Number(amount),
      status: 'pending',
      checkout_id: checkoutId
    }
    console.log('💾 EXACT INSERT DATA:', JSON.stringify(insertData, null, 2))
    console.log('🚨 PHONE BEFORE INSERT:', validatedPhone, 'TYPE:', typeof validatedPhone, 'LENGTH:', validatedPhone?.length)
    
    const { error: dbError } = await getSupabaseAdmin()
      .from('payments')
      .insert(insertData)


    if (dbError) {
      console.error('Supabase insert error:', dbError)
      return NextResponse.json({ 
        error: 'Failed to create payment record', 
        details: dbError.message, 
        code: dbError.code 
      }, { status: 500 })
    }

    console.log(`💾 Payment saved: ${validatedPhone} | ${packageId || 'basic'} | KSH${amount} | ${checkoutId}`)

    // Step 6: PayHero STK push
    const baseUrl = process.env.NEXT_PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const callbackUrl = `${baseUrl}/api/webhook`

    const authHeader = payHeroToken.startsWith('Basic ') ? payHeroToken : `Basic ${payHeroToken}`

    console.log('📤 PayHero STK Request to', validatedPhone)

// Test both formats for PayHero
    const payHeroPhone = validatedPhone.startsWith('2547') ? '0' + validatedPhone.slice(4) : validatedPhone
    const payHeroRequest = {
      Amount: amount,
      PhoneNumber: payHeroPhone,
      Provider: Provider || 'm-pesa'
    }
    console.log('🚀 PayHero EXACT REQUEST:', JSON.stringify(payHeroRequest, null, 2))
    
    const stkResponse = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payHeroRequest)
    })
    
    const stkData = await stkResponse.json()
    console.log('📥 PayHero Response:', JSON.stringify(stkData, null, 2))
    console.log('📥 PayHero Response:', JSON.stringify(stkData, null, 2))

    const payHeroCheckoutId = stkData.CheckoutRequestID
    if (payHeroCheckoutId && payHeroCheckoutId !== checkoutId) {
      await getSupabaseAdmin()
        .from('payments')
        .update({ checkout_id: payHeroCheckoutId })
        .eq('checkout_id', checkoutId)
      console.log(`🔗 Updated checkout ID: ${checkoutId} → ${payHeroCheckoutId}`)
    }

    if (stkData.ResponseCode !== '0') {
      const errorMsg = stkData.ResponseDescription || 'PayHero error'
      await getSupabaseAdmin()
        .from('payments')
        .update({ status: 'failed', result_desc: errorMsg })
        .eq('checkout_id', payHeroCheckoutId || checkoutId)
      return NextResponse.json({
        error: `STK failed: ${errorMsg}`,
        details: stkData
      }, { status: 400 })
    }

    console.log(`✅ STK sent to ${validatedPhone} KSH${amount} | ID: ${checkoutId}`)

    return NextResponse.json({
      success: true,
      checkoutId,
      payHeroId: payHeroCheckoutId,
      message: `STK push sent! Enter PIN on ${validatedPhone}. Checkout ID: ${checkoutId}`
    })

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    console.error('📋 Full request details:', {
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      body
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      hint: 'Check server logs for RECEIVED BODY and EXACT INSERT DATA'
    }, { status: 500 })
  }
}


