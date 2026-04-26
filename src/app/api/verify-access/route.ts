import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const packageDurations: Record<string, number> = {
  basic: 30,      // 30 minutes
  pro: 120,       // 2 hours
  vip: 1440       // 24 hours
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ hasAccess: false, message: 'Phone number required' })
    }

    // Find the most recent paid payment for this phone
    const { data: payments, error } = await getSupabaseAdmin()
      .from('payments')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ hasAccess: false, message: 'Database error' })
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json({ hasAccess: false, message: 'No paid package found. Please purchase a package.' })
    }

    const payment = payments[0]
    const packageId = payment.package_id
    const durationMinutes = packageDurations[packageId] || 10

    // Check if package is still active
    const purchaseTime = new Date(payment.created_at).getTime()
    const expiryTime = purchaseTime + (durationMinutes * 60 * 1000)
    const now = Date.now()

    if (now > expiryTime) {
      const expiredMinutes = Math.floor((now - expiryTime) / 60000)
      return NextResponse.json({
        hasAccess: false,
        message: `Your ${packageId.toUpperCase()} package expired ${expiredMinutes} minutes ago. Please buy again.`
      })
    }

    const remainingMinutes = Math.floor((expiryTime - now) / 60000)

    return NextResponse.json({
      hasAccess: true,
      package: packageId,
      remainingMinutes,
      message: `Access granted! ${remainingMinutes} minutes remaining on your ${packageId.toUpperCase()} package.`
    })

  } catch (error) {
    console.error('Verify access error:', error)
    return NextResponse.json({ hasAccess: false, message: 'Server error' })
  }
}

