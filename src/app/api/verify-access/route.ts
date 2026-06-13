import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  // Expect phone via querystring: /api/verify-access?phone=...
  const url = new URL(req.url)
  const phone = url.searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ hasAccess: false, message: 'phone is required' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ hasAccess: false, message: 'Supabase admin not configured' }, { status: 500 })
  }

  // Check for any paid payment for the phone.
  // (If you later add duration/expiry, compute it here.)
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('status')
    .eq('phone', phone)
    .eq('status', 'paid')
    .limit(1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })


  const hasAccess = Array.isArray(data) && data.length > 0

  return NextResponse.json({ hasAccess, message: hasAccess ? 'VIP access granted' : 'VIP access not found' })
}


