# Aviator Signals - Kenyan Betting Site 🚀

## Features
- **Target: Kenyans only** – MPESA STK Push (PayHero)
- Live Aviator crash signals (95% win rate demo)
- Packages: KSH100/10min → KSH2000/day
- Pro neon betting design
- Supabase auth/DB ready

## How to Deploy Production
```
1. vercel login
2. vercel --prod
↓ https://your-aviator.vercel.app
```

## PayHero Setup
```
PayHero Dashboard:
- Callback: https://your-site.vercel.app/api/webhook
- .env.local: PAYHERO_TOKEN=sk_live_...
```

## Test Local
```
npm run dev
localhost:3000/packages → Buy → STK sim
```

## File Structure
```
src/app/
├── page.tsx (Landing)
├── packages/page.tsx (Buy)
├── dashboard/page.tsx (Signals)
└── api/
    ├── create-payment/route.ts (STK Push)
    └── webhook/route.ts (Callback)
```

**Pure Kenyan MPESA + Supabase – Ready to earn!** 🎰🇰🇪
