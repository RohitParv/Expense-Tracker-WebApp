# Expense Tracker

A small expense tracker built with Next.js (App Router) and Supabase. Log
expenses as "Credit Card" or "Regular", see totals and a category
breakdown, and everything syncs in real time across devices through a
shared Supabase backend. Installable as a PWA on a phone home screen.

## Stack

- **Next.js** (App Router) for the frontend and API routes
- **Supabase** for Postgres + email/password auth
- **Tailwind CSS** for styling
- **Recharts** for the category breakdown chart
- Deploy target: **Vercel**

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql). It
   creates the `expenses` table, row-level security policies scoped to
   `auth.uid()`, and enables Realtime on the table.
3. In **Authentication -> Providers**, confirm Email is enabled. For local
   testing you can disable "Confirm email" under **Authentication ->
   Settings** so signup logs you in immediately.
4. Copy the Project URL and `anon` public key from **Project Settings ->
   API**.

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

These are safe to expose to the browser — access to data is enforced by the
row-level security policies in `schema.sql`, not by keeping the anon key
secret.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up with an email
and password, and start adding expenses.

## Project structure

```
src/
  app/
    login/page.tsx     Login / signup (Supabase email+password auth)
    page.tsx            Dashboard (server component, protected route)
    layout.tsx           Root layout, PWA metadata
  components/
    AddExpenseForm.tsx   Add-expense form (amount, date, category, notes)
    Dashboard.tsx         Totals, category chart, recent list, realtime sync
    LogoutButton.tsx
    ServiceWorkerRegister.tsx
  lib/supabase/
    client.ts             Browser Supabase client
    server.ts              Server Component / Route Handler Supabase client
    middleware.ts           Session refresh + route protection helper
    types.ts                 Database type definitions
  proxy.ts                 Next.js proxy (formerly "middleware") — refreshes
                             the Supabase session and redirects unauthenticated
                             users to /login
supabase/schema.sql        Table, RLS policies, realtime publication
public/manifest.json        PWA manifest
public/sw.js                 Minimal service worker (network-first)
```

## Real-time sync across devices

The dashboard subscribes to Postgres changes on the `expenses` table
(filtered to the signed-in user) via Supabase Realtime. Adding an expense
on one device — phone or desktop — pushes the change to every other open
session for that user without a manual refresh.

## PWA / "Add to Home Screen"

`public/manifest.json` and the icons in `public/icons` make the app
installable. On iOS, use Safari's Share -> "Add to Home Screen"; on
Android/Chrome, use the browser's install prompt. A minimal service worker
(`public/sw.js`) is registered for installability; it does not cache API
responses, since expense data must always come from Supabase live.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   environment variables in the Vercel project settings.
3. In Supabase, add your Vercel domain (and any preview domains you use)
   under **Authentication -> URL Configuration -> Redirect URLs** if you
   later add magic-link or OAuth flows. Email/password login as configured
   here doesn't require a redirect URL.
4. Deploy.
