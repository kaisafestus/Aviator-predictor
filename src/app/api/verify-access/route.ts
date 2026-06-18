import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const phone = url.searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ hasAccess: false, message: 'phone is required' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ hasAccess: false, message: 'Supabase admin not configured' }, { status: 500 })
  }

  // Find the most recent paid payment for this phone that hasn't expired yet
  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('id, package_id, expires_at, created_at')
    .eq('phone', phone)
    .eq('status', 'paid')
    .gt('expires_at', now)           // must not be expired
    .order('expires_at', { ascending: false })
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const hasAccess = Array.isArray(data) && data.length > 0

  if (!hasAccess) {
    return NextResponse.json({ hasAccess: false, message: 'No active package found' })
  }

  const record = data[0]
  const expiresAt = new Date(record.expires_at)
  const msLeft = expiresAt.getTime() - Date.now()
  const minutesLeft = Math.max(0, Math.ceil(msLeft / 60000))

  return NextResponse.json({
    hasAccess: true,
    message: `VIP access active — ${minutesLeft} min remaining`,
    packageId: record.package_id,
    expiresAt: record.expires_at,
    minutesLeft,
  })
}
