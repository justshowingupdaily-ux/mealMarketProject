# Mathura Meal Market — demand-validation app

A mobile-first, static web app (HTML/CSS/JS, no build step) that tests real demand for a vegetarian home-style meal service in Mathura **before** you invest in a kitchen. It is a research pilot: no orders, payments or bookings.

## Files
- `index.html`, `styles.css`, `js/` — the app (public site + owner dashboard at `#/admin`)
- `config.js` — Supabase keys, site URL, privacy contact, locality list
- `supabase/schema.sql` — tables, row-level security, duplicate flagging, rate limit

## Run it now (demo mode)
Open `index.html` via any static server (`python3 -m http.server`) or just double-click it. With empty keys in `config.js` it runs in **demo mode**: submissions are saved only in that browser's localStorage. The yellow banner says so. Owner passcode in demo mode is chosen on first visit and is **not real security**.

## Go live (≈20 minutes)
1. Create a free project at supabase.com. SQL Editor → paste and run `supabase/schema.sql`.
2. Authentication → Users → *Add user* (your email + strong password). Then run:
   `insert into public.admins (user_id) select id from auth.users where email = 'YOU@example.com';`
3. Authentication → Providers → Email → **turn off “Allow new users to sign up”**.
4. Project Settings → API: copy the Project URL and the **anon** key into `config.js`. Never use the `service_role` key anywhere in this app.
5. Set `SITE_URL` (your final address) and `PRIVACY_CONTACT` in `config.js`.
6. Deploy the folder to Netlify / Vercel / Cloudflare Pages / GitHub Pages (drag-and-drop works; no build command). Optionally add the site address to Supabase Auth → URL configuration.
7. Test: submit a survey from your phone, sign in at `yoursite/#/admin`, confirm it appears. Check that an anonymous visitor cannot read data (the anon key can only insert).

## What works fully vs. needs setup
| Feature | Status |
|---|---|
| Homepage, 7 service cards with working CTAs, Hindi/Hinglish toggle (main interface) | Works |
| Menu with filters, proposed prices, “would consider” picks, daily/weekly/monthly comparison | Works (food shown as original illustrations — add your own photos once you cook) |
| 5-step survey, branching, back/edit, progress bar, price bands, opt-in randomised price experiment | Works |
| Catering funnel, launch-interest form, consent + timestamp + wording stored, duplicate flagging (kept, never dropped) | Works |
| Admin dashboard: funnel, KPIs, 6+ charts, filters, lead statuses/notes, qualified-lead rules, campaign spend & cost per lead, CSV export, deletion request handling | Works |
| Feasibility calculator (3 scenarios) | Works; saved in your browser only |
| Share page, WhatsApp message, Instagram concept, A4 poster with QR | Works (QR needs internet) |
| Persistent, cross-device storage + real admin login + access control | **Needs Supabase setup above** |
| Spam protection | Basic: hidden honeypot, minimum fill time, 5 submits/hour per device, 5/day per phone number (database). For stronger protection add Cloudflare Turnstile/hCaptcha — not included |
| Demo-preview data | Fictional, clearly labelled, never mixed with real data |

## Where data lives
- Live mode: your Supabase tables `submissions`, `page_events`, `app_settings`.
- Demo mode: the visitor's own browser (`localStorage`).

## Honesty guardrails built in
Every price is “proposed / not available to order”; all survey metrics are “stated interest”; paid orders stay 0 until you enter real ones; no invented reviews, customers or demand; no promotional messages without separate opt-in.

## Before launch
- Review the privacy notice (`#/privacy`) with a legal adviser; set a real contact in `config.js`.
- Retention promise in the notice: contact details deleted within 12 months — keep to it.
- Exported CSVs contain personal data: store securely, delete when done.

jzksC8UzKZdldpUM
