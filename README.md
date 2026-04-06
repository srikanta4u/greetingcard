# AutoCard Marketplace

## Tech Stack

- Next.js 15, TypeScript, Tailwind CSS
- Supabase (Auth, Database, Storage)
- Stripe (Payments)
- Resend (Email)

## Getting Started

1. Clone the repo
2. Copy `.env.production.example` to `.env.local`
3. Fill in environment variables
4. `npm install && npm run dev`

## Key Routes

- `/` — Landing page
- `/marketplace` — Browse cards
- `/dashboard` — Buyer dashboard
- `/creator/dashboard` — Creator earnings
- `/admin/orders` — Admin panel

## Deployment

Deploy to [Vercel](https://vercel.com). Set all env vars from `.env.production.example`.

Enable Vercel cron jobs for scheduled card processing (`vercel.json` defines a daily run of `/api/cron/process-scheduled`). Ensure `CRON_SECRET` is set in the project; Vercel will send it as a Bearer token.

Use `NEXT_PUBLIC_URL` as your canonical site URL (no trailing slash). In production, middleware redirects `www` → apex when the canonical host has no `www`, and login redirects use this URL.

The production build uses `output: "standalone"` in `next.config.ts` for an optimized Node server image (used by Vercel and self-hosted Docker-style deploys).
