import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  // Return only boolean flags so no secrets are exposed.
  const configured = {
    PAYHERO_STK_PUSH_URL: Boolean(process.env.PAYHERO_STK_PUSH_URL),
    PAYHERO_BASIC_AUTH_TOKEN: Boolean(process.env.PAYHERO_BASIC_AUTH_TOKEN),
    PAYHERO_ACCOUNT_ID: Boolean(process.env.PAYHERO_ACCOUNT_ID),
    PAYHERO_CHANNEL_ID: Boolean(process.env.PAYHERO_CHANNEL_ID),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseAdminClientAvailable: Boolean(supabaseAdmin),
  }

  return NextResponse.json({ configured })
}
