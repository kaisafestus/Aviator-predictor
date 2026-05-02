import { createClient, SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔍 Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET'
  })

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ MISSING ENV VARS:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'SET' : 'MISSING'
    })
    throw new Error('❌ Missing Supabase configuration! Please add to .env.local:\n- NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n- SUPABASE_SERVICE_ROLE_KEY=your-service-key')
  }

  // Validate URL format
  if (!supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('localhost')) {
    throw new Error('Invalid Supabase URL format. Should be like: https://xxx.supabase.co')
  }

  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return adminClient
}

