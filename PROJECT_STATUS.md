# SalahTrack: Project Status

_Last updated: 15 October 2026 · Latest commit: `8adc6ef`_

SalahTrack is a mobile-first, NFC-enabled Islamic prayer tracking web app.
The frontend is built and runs on sample data. **Supabase is not connected yet.**

---

## 1. Summary

| Area | Status |
| --- | --- |
| Frontend (4 screens) | ✅ Built, committed and tested at iPhone size |
| Data | ⚠️ Sample data only (`lib/demo-data.ts`), nothing is saved |
| Supabase project connected | ❌ No: no project URL or key configured |
| Environment variables | ❌ Not set (only `.env.example` exists) |
| Authentication | 🟡 Starter auth code exists but is **inactive** until Supabase is connected |
| Database tables | ❌ None yet |
| NFC | ❌ Not started (Scan screen is visual only) |

---

## 2. Tech stack

| Item | Version |
| --- | --- |
| Next.js (App Router, Turbopack, `cacheComponents: true`) | 16.4.1 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS (+ `tailwindcss-animate`) | 3.4 |
| `@supabase/supabase-js` | 2.118.0 (installed) |
| `@supabase/ssr` | 0.12.7 (installed) |
| Icons | `lucide-react` (came with the starter) |

Platform: Windows 11, local development at `http://localhost:3000`.

---

## 3. What has been built (frontend)

All app screens live in the `app/(main)/` route group. Its layout gives every
screen the same background and bottom navigation. The `(main)` folder name
does not appear in URLs.

| URL | File | What it does |
| --- | --- | --- |
| `/dashboard` | `app/(main)/dashboard/page.tsx` | Greeting, Gregorian + Hijri date, progress ring (x/5), five prayers with Confirm/Done buttons, streak card, 7-day bar chart and stats |
| `/history` | `app/(main)/history/page.tsx` | 7/14-day switch, completion %, perfect days, missed count, per-day prayer breakdown |
| `/scan` | `app/(main)/scan/page.tsx` | "Ready to scan" screen with animated scanning state and a "How it works" guide (no real NFC) |
| `/settings` | `app/(main)/settings/page.tsx` | Guest profile card, reminder/Hijri/vibration switches, calculation method, version (not saved) |

Shared code:

| File | Purpose |
| --- | --- |
| `app/(main)/layout.tsx` | Shared background, page width and bottom nav; sets page title "SalahTrack" |
| `components/salahtrack/bottom-nav.tsx` | Bottom navigation (Home, History, Scan, Settings) with active-tab highlight |
| `components/salahtrack/ui.tsx` | Shared animation/card styles and `PageHeader` |
| `lib/demo-data.ts` | **All sample data**: prayer list, today's confirmations, 14 days of history, streaks. This is what the database will replace. |
| `lib/use-today.ts` | Reads today's date in the browser (user's time zone) |

Behaviour notes:

- Prayer confirmations, settings switches and the scan button use React state
  only. Refreshing the page resets them.
- Prayer times are fixed sample values, not calculated for a location.
- The starter's home page (`/`) and root layout metadata were left unchanged.

---

## 4. Supabase status (verified 15 October 2026)

### 4.1 Supabase client code: present (from the starter template)

| File | Purpose |
| --- | --- |
| `lib/supabase/client.ts` | Browser client (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server client (`createServerClient`, cookie-based) |
| `lib/supabase/proxy.ts` | Refreshes the session on each request and redirects logged-out users |
| `proxy.ts` | Next.js 16 proxy (formerly "middleware") that calls `updateSession` on all routes except static files |
| `lib/utils.ts` | `hasEnvVars` check: Supabase features switch off when env vars are missing |

The client code reads exactly two variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 4.2 Environment variables: not configured

| Check | Result |
| --- | --- |
| `.env.local` / `.env` / other `.env.*` files | Not present |
| `.env.example` | Present, contains placeholders only |
| Variables in the shell / Windows user / Windows system environment | Not set |
| Any `.env` file ever committed to Git | No (only `.env.example`) |
| `.gitignore` excludes `.env` and `.env*.local` | Yes |

No credentials were found, so none could be exposed.

### 4.3 Connected Supabase project: none

- With no URL or key, the app cannot reach any Supabase project. A live
  connection test was not possible.
- The running app confirms this: the starter home page (`/`) shows
  "Supabase environment variables required".
- There is no `supabase/` folder (no Supabase CLI project, migrations or
  local config).
- Database tables: none created.

### 4.4 Authentication: code present, inactive

The starter includes a complete email + password flow. It is **not active**
because Supabase is not connected.

| Feature | Location | Supabase call |
| --- | --- | --- |
| Sign up (sends confirmation email) | `app/auth/sign-up`, `components/sign-up-form.tsx` | `auth.signUp` (redirects to `/protected`) |
| Email confirmation link handler | `app/auth/confirm/route.ts` | `auth.verifyOtp` |
| Log in | `app/auth/login`, `components/login-form.tsx` | `auth.signInWithPassword` |
| Forgot / reset password | `app/auth/forgot-password`, `app/auth/update-password` | `auth.resetPasswordForEmail`, `auth.updateUser` |
| Log out | `components/logout-button.tsx` | `auth.signOut` |
| Example protected page | `app/protected` | `auth.getClaims` |
| Route protection | `lib/supabase/proxy.ts` | `auth.getClaims` |

Settings on the Supabase dashboard (email provider, Site URL, redirect URLs,
email templates) can't be checked until a project exists.

---

## 5. Things to know before connecting Supabase

1. **The app pages will require login straight away.** Once the env vars are
   set, `lib/supabase/proxy.ts` redirects logged-out visitors to
   `/auth/login` on every route except `/` and `/auth/*`. That includes
   `/dashboard`, `/history`, `/scan` and `/settings`. Plan the auth step with
   this in mind, or decide which routes should stay public.
2. **After sign-up, users land on the starter's `/protected` page.**
   `emailRedirectTo` in `components/sign-up-form.tsx` points there. It should
   point to `/dashboard` later.
3. **Possible open redirect in the starter.** `app/auth/confirm/route.ts`
   redirects to the `next` query value without checking it, so a crafted
   confirmation link could send users to another website. Restrict `next` to
   paths inside the app when working on authentication.
4. **Only use the publishable (anon) key in the app.** Variables starting with
   `NEXT_PUBLIC_` are visible in the browser. The `service_role` key must
   never be given a `NEXT_PUBLIC_` name or used in client code. Every table
   will need **Row Level Security** turned on with per-user policies.
5. **Unpinned versions.** `package.json` uses `"latest"` for `next`,
   `@supabase/supabase-js` and `@supabase/ssr`. Consider pinning them so a
   fresh install doesn't pull in breaking changes.
6. **No Git remote.** The repository exists only on this computer
   (branch `master`). Consider pushing to a private GitHub repo as a backup.

---

## 6. NFC note (for later planning)

Safari on iPhone doesn't support Web NFC, so a web page can't read tags
directly on iOS. Android Chrome supports it. The cross-platform approach is to
store a **URL** on each tag (an NDEF URL record, e.g.
`https://<app-domain>/scan?tag=<tag-id>`). An iPhone opens that link natively
when it taps the tag, and Android does the same. The app then records the
prayer from that page.

---

## 7. Git history

| Commit | Description |
| --- | --- |
| `8adc6ef` | Add working bottom navigation with History, Scan and Settings pages |
| `0a90dbd` | Add SalahTrack dashboard with demo data |
| `b943e8b` | Initial commit from Create Next App |

---

## 8. Suggested next steps

Order follows the plan: database → authentication → NFC.

1. **Create a Supabase project** at supabase.com (user action).
2. **Create `.env.local`** from `.env.example` with the project URL and
   publishable key (user action, never committed). Restart `npm run dev`.
3. **Verify connectivity.** The starter home page should switch from
   "environment variables required" to the sign-in buttons. `/dashboard` will
   now redirect to login (expected, see §5.1).
4. **Agree on the database design** (with ChatGPT), e.g. profiles, prayer
   logs (user, date, prayer, confirmed at, source: button/NFC), NFC tags and
   settings, with Row Level Security on every table. Consider keeping the
   schema as SQL migrations with the Supabase CLI.
5. **Authentication step:** decide which pages are public, point sign-up to
   `/dashboard`, fix the `next` redirect check, and set Site URL / redirect
   URLs in the Supabase dashboard.
6. **Replace `lib/demo-data.ts`** with real reads and writes, one screen at a
   time, starting with the dashboard confirmations.
7. **NFC**, using the URL-on-tag approach above.
