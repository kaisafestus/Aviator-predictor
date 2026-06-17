# Supabase Setup for Aviator

This document explains how to create a Supabase project, apply the provided SQL schema, and connect this Next.js app to Supabase.

1) Create a Supabase project
- Go to https://app.supabase.com and create a new project.
- Note the Project URL (looks like `https://xxxx.supabase.co`) and project `anon` and `service_role` keys.

2) Apply the SQL schema
- Open the Supabase dashboard for your project.
- Go to "SQL Editor" -> "New query" and paste the contents of `src/lib/supabase-schema.sql`.
- Run the query. This will create `packages` and `payments` tables and seed example packages.

3) Environment variables
Set the following environment variables for your local development and for your deployment (Vercel, Netlify, etc):

- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon (public) key
- `SUPABASE_URL` = same as `NEXT_PUBLIC_SUPABASE_URL` (used by server admin client)
- `SUPABASE_SERVICE_ROLE_KEY` = your service role key (keep secret; used server-side only)

Example `.env.local` (do NOT commit this file):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...anon...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...service_role...
```

4) How the app uses Supabase
- Client code uses the public `supabase` client (`NEXT_PUBLIC_*` keys). In this app most write/read operations are performed server-side.
- Server API routes use `supabaseAdmin` (service role key) in `src/lib/supabase-admin.ts` to insert payments and update statuses (`/api/create-payment`, `/api/webhook`, `/api/verify-access`).

5) Payment provider integration (to be configured)
- This project supports payment provider integration (e.g., M-Pesa STK push via PayHero).
- Configuration details will be added once the provider API is finalized.
- For now, `/api/create-payment` creates a payment record in Supabase and returns a `checkoutId`.

6) Testing the endpoints
- Create a payment:

```bash
curl -X POST https://your-deployment-url/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{"phone":"0712345678", "packageId":"basic", "amount":100}'
```

- Verify access:

```bash
curl "https://your-deployment-url/api/verify-access?phone=0712345678"
```

7) Payment provider integration
- When a payment provider is configured, modify `/api/create-payment` to call the provider's STK push endpoint after creating the payment record.
- Update `/api/webhook` to handle provider callbacks and update payment status from `pending` to `paid` or `failed`.

8) Troubleshooting
- If inserts/updates fail, confirm `SUPABASE_SERVICE_ROLE_KEY` is set and `supabaseAdmin` is not `null`.
- Check the Supabase SQL editor for errors when running the schema.
