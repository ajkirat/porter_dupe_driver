# Pikop Driver

The driver app for [Pikop](https://github.com/ajkirat/porter_dupe), a bike parcel delivery service for Bengaluru. It is a separate installable web app (PWA) that shares one Supabase project with the customer app.

**Features:** phone OTP login, KYC signup, online/offline switch, new-request popup with 30 s countdown, sound and vibration, nearby requests list, trip flow (navigate, "I've arrived", pickup and drop OTP, collect-payment banner, call sender or receiver, drop a job with a reason), live location for customer tracking, earnings (today, week, month, 7-day chart, trip history, net of pass cost), pass status and how to buy, profile and documents, support call and WhatsApp, screen wake lock, offline banner.

## Database

All tables, RLS policies and functions live in the customer repo: `supabase/migrations/0001` to `0004` in <https://github.com/ajkirat/porter_dupe>. Run them in the Supabase SQL editor first.

## Run it

```bash
cp .env.example .env.local   # same Supabase URL and anon key as the customer app
npm install
npm run dev
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same project as the customer app |
| `NEXT_PUBLIC_OPERATOR_UPI` | Where drivers pay for their pass |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Support number for call and WhatsApp, e.g. `+919999999999` |

## Deploy

Create a second Netlify site from this repo with the same environment variables. Open the site on a phone and use "Add to Home screen".

## Limits of a web app

Location updates only while the app is open (the screen is kept awake while online). Background tracking and push notifications need a native app, which is a later step.
