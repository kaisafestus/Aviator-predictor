# TODO

- [x] PayHero STK Push connected — `src/lib/payhero.ts` sends real M-Pesa prompts.
- [x] Access control enforced — dashboard is gated behind `verify-access` check.
- [x] Package expiry logic added — `expires_at` set on payment confirmation; `verify-access` checks it.
- [x] Mega multiplier frequency increased — 300x–499x: 10%, 500x–1030x: 5% (was 10% total rare, now 35% common / 30% medium / 20% high / 10% rare / 5% mega).

## Remaining
- [ ] Run `npx supabase db push` or paste the updated `supabase-schema.sql` in the Supabase SQL editor to add `checkout_id` and `expires_at` columns.
- [ ] Add `PAYHERO_AUTH_TOKEN`, `PAYHERO_CHANNEL_ID`, `PAYHERO_STK_PUSH_URL`, `NEXT_PUBLIC_APP_BASE_URL` to Vercel environment variables.
- [ ] Set PayHero webhook URL to `https://aviator-predictor-mauve.vercel.app/api/webhook` in the PayHero dashboard.
