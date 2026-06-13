import { createClient } from '@supabase/supabase-js'

// Public client (browser/server-safe usage). Use SUPABASE_URL + SUPABASE_ANON_KEY.
// These must be set in your environment.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

