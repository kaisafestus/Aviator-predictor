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

5) PayHero (M-Pesa STK push) integration
- This project supports triggering an M-Pesa STK push via a third-party provider (PayHero). To enable it, set the following environment variables in addition to the Supabase ones:

- `PAYHERO_STK_PUSH_URL` = full URL to the PayHero STK-push endpoint
- `PAYHERO_BASIC_AUTH_TOKEN` = Basic auth token (e.g. `Basic ...`)
- `PAYHERO_ACCOUNT_ID` = the account id (optional if supplied in payload)
- `PAYHERO_CHANNEL_ID` = the channel id to use (optional if supplied in payload)

- Example (do NOT commit):

```
PAYHERO_STK_PUSH_URL=https://payhero.example/api/stkpush
PAYHERO_BASIC_AUTH_TOKEN=Basic cTI4d29q...YourToken...
PAYHERO_ACCOUNT_ID=5489
PAYHERO_CHANNEL_ID=6598
```

- When the above are configured the API endpoint `/api/create-payment` will call PayHero after creating the local `payments` record and return the provider's response to the frontend. If these vars are not configured the route will return a mock response and keep the payment as `pending`.

5) Testing the endpoints
- Create a payment (mocked PayHero disabled by default):

```bash
curl -X POST https://your-deployment-url/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{"phone":"0712345678", "packageId":"basic", "amount":100}'
```

- Simulate webhook to mark payment paid:

```bash
curl -X POST https://your-deployment-url/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"checkoutId":"local_...","status":"paid"}'
```

- Verify access:

```bash
curl "https://your-deployment-url/api/verify-access?phone=0712345678"
```

6) Optional: Enable Row-Level Security (RLS)
If you plan to allow client-side writes directly from the browser, enable RLS and add policies for authenticated users. Since this app performs writes server-side with the service role, RLS is not strictly necessary.

7) Troubleshooting
- If inserts/updates fail, confirm `SUPABASE_SERVICE_ROLE_KEY` is set and `supabaseAdmin` is not `null`.
- Check the Supabase SQL editor for errors when running the schema.

If you'd like, I can also:
- Add a small migration script to run the schema from the command line.
- Add seed insertion endpoint for dev testing.

*** End of instructions ***
