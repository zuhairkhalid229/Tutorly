# Deploying Tutorly

About 20 minutes. Everything here fits in the free tiers of Supabase, Vercel and Google AI Studio.

## 1. Gemini API key

1. Go to [Google AI Studio → API keys](https://aistudio.google.com/apikey).
2. **Delete any old Tutorly key.** Version 1 of this repo had one committed in `src/services/ai-test.service.ts`, so treat it as public.
3. Create a new key. You'll paste it into Vercel as `GEMINI_API_KEY`.

## 2. Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project** (free plan, any region near your users).
2. **SQL Editor → New query.** Paste the whole of `supabase/migrations/20261005000000_init.sql` and run it.
3. **Authentication → Sign In / Providers → Email:** turn **Confirm email** off. On the free plan Supabase sends only a few emails per hour, which would block sign-ups. Leave it on if you set up your own SMTP server.
4. **Authentication → URL Configuration:** set **Site URL** to your Vercel URL once you have it (step 3).
5. **Project Settings → API Keys:** copy the **Project URL**, the **publishable** key (older projects call it *anon public*) and the **secret** key (*service_role*).

## 3. Load demo data

In the project folder, create `.env.local` from `.env.example` and fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Optionally set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to create your admin login. Then run:

```bash
npm run seed
```

This creates 9 sample tutors, 6 students, lessons, reviews and messages, plus the two public demo logins.

## 4. Vercel

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo. Vercel detects Vite from `vercel.json`.
2. Add these **Environment Variables** before the first deploy:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_ANON_KEY` | publishable (anon) key |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret (service_role) key |
   | `GEMINI_API_KEY` | from step 1 |
   | `CRON_SECRET` | any long random string |

3. Deploy. The daily cron in `vercel.json` (03:00 UTC) resets the demo data and keeps the Supabase project active.
4. Put the Vercel URL into Supabase's **Site URL** (step 2.4).

## Checking it works

- Home page → type "help with calculus" → three tutors with reasons.
- Login → **Demo tutor** → AI verification → pick a subject → the test arrives in 15–40 seconds.
- Login → **Demo student** → Find a tutor → book a slot.

If AI features say they aren't switched on, `GEMINI_API_KEY` is missing in Vercel. Redeploy after adding it.
