# SalahTrack: Project Status

_Last updated: 15 October 2026 · Latest commit before this update: `6f994d2`_

SalahTrack is a mobile-first, NFC-enabled Islamic prayer tracking web app.
The frontend is built and runs on sample data. **The app is now connected to
the Supabase project "Salah-Track"** (verified). No database tables exist yet.

---

## 1. Summary

| Area | Status |
| --- | --- |
| Frontend (4 screens) | ✅ Built, committed and tested at iPhone size |
| Data | ⚠️ Sample data only (`lib/demo-data.ts`), nothing is saved |
| Supabase project connected | ✅ Yes: `Salah-Track`, verified 15 October 2026 |
| Environment variables | ✅ Set in `.env.local` (Git-ignored, not committed) |
| Authentication | 🟡 Active (starter email + password flow), **not yet tested with a real account**. Redirect fixes are pending (see §5). |
| App pages while logged out | ⚠️ Redirect to `/auth/login` (expected, see §5.1) |
| Database tables | ❌ None yet (intentional) |
| NFC | ❌ Not started (Scan screen is visual only) |

---

## 2. Tech stack

| Item | Version |
| --- | --- |
| Next.js (App Router, Turbopack, `cacheComponents: true`) | 16.4.1 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS (+ `tailwindcss-animate`) | 3.4 |
| `@supabase/supabase-js` | 2.118.0 |
| `@supabase/ssr` | 0.12.7 |
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

### 4.1 Project

| Item | Value |
| --- | --- |
| Project name | Salah-Track |
| Project URL | `https://kppyinaagomddmfcyjrt.supabase.co` |
| Region | eu-west-1 |
| Status | Active |

### 4.2 Environment variables

Stored in `.env.local` in the project root. Values are not reproduced here.

| Variable | Status |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set to the project URL above |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ Set. Verified to be a **publishable** key (`sb_publishable_` format, no stray spaces or quotes). |
| Secret / `service_role` key | ✅ **Not used anywhere** in the project |

| Safety check | Result |
| --- | --- |
| `.env.local` is Git-ignored | ✅ Yes (`.gitignore` line 34: `.env*.local`); `git status` does not list it |
| Credentials committed to Git | ✅ None |
| Credentials printed in logs or reports | ✅ None (all checks reported only the key type and length) |

### 4.3 Connectivity tests

Run from the project folder using the values in `.env.local`:

| Test | Result | Meaning |
| --- | --- | --- |
| `GET /auth/v1/health` without a key | 401 | Project exists and requires an API key |
| `GET /auth/v1/settings` with the publishable key | ✅ 200 | The key is accepted by **this** project |
| Same request with a fake key (control test) | 401 | Confirms the 200 above is real |
| `GET /rest/v1/<missing table>` with the publishable key | 404 `PGRST205` "Could not find the table" | Database API reachable. The error is expected because no tables exist yet. |
| `GET /rest/v1/` (schema listing) with the publishable key | 401 "Secret API key required" | Expected. Supabase only lets secret keys list the whole schema. |

Auth settings reported by the project:

| Setting | Value |
| --- | --- |
| Email provider | Enabled |
| Sign-ups | Allowed |
| Email confirmation | Required (`mailer_autoconfirm: false`) |

### 4.4 Running app

The dev server picked up `.env.local` automatically ("Reload env: .env.local"
in the Next.js log), so no restart was needed.

| Page | Result |
| --- | --- |
| `/` (starter home) | ✅ 200. "Environment variables required" warning gone, **Sign in** link shown. |
| `/auth/login`, `/auth/sign-up` | ✅ 200, forms render |
| `/dashboard`, `/history`, `/scan`, `/settings` | ↪️ Redirect to `/auth/login` (expected, §5.1) |
| `/protected` | ↪️ Redirect to `/auth/login` (expected) |
| Browser console | ✅ No errors |

The four SalahTrack screens themselves are unchanged and were last checked
working before Supabase was connected. They can't be viewed again until login
works or they are made public.

### 4.5 Supabase code in the project (from the starter template)

| File | Purpose |
| --- | --- |
| `lib/supabase/client.ts` | Browser client (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server client (`createServerClient`, cookie-based) |
| `lib/supabase/proxy.ts` | Refreshes the session on each request and redirects logged-out users |
| `proxy.ts` | Next.js 16 proxy (formerly "middleware") that calls `updateSession` on all routes except static files |
| `lib/utils.ts` | `hasEnvVars` check: Supabase features switch on now that both variables are set |

Database tables: none. There is no `supabase/` folder (no Supabase CLI
migrations yet).

### 4.6 Authentication flows (starter, now active, untested)

| Feature | Location | Supabase call |
| --- | --- | --- |
| Sign up (sends confirmation email) | `app/auth/sign-up`, `components/sign-up-form.tsx` | `auth.signUp` (redirects to `/protected`) |
| Email confirmation link handler | `app/auth/confirm/route.ts` | `auth.verifyOtp` |
| Log in | `app/auth/login`, `components/login-form.tsx` | `auth.signInWithPassword` |
| Forgot / reset password | `app/auth/forgot-password`, `app/auth/update-password` | `auth.resetPasswordForEmail`, `auth.updateUser` |
| Log out | `components/logout-button.tsx` | `auth.signOut` |
| Example protected page | `app/protected` | `auth.getClaims` |
| Route protection | `lib/supabase/proxy.ts` | `auth.getClaims` |

No account has been created yet. Account sign-up testing is deliberately on
hold until the redirect issues in §5 are fixed.

---

## 5. Open issues to fix before testing sign-up

1. **App pages require login.** `lib/supabase/proxy.ts` redirects logged-out
   visitors to `/auth/login` on every route except `/` and `/auth/*`. This is
   now **active**. Decide which pages should be public and which need an
   account.
2. **Sign-up lands on the starter page.** `emailRedirectTo` in
   `components/sign-up-form.tsx` points to `/protected`. It should point to
   `/dashboard`.
3. **Open redirect in the starter.** `app/auth/confirm/route.ts` redirects to
   the `next` query value without checking it. Restrict it to paths inside
   the app.
4. **Supabase dashboard URL settings.** Set **Site URL** and **Redirect URLs**
   (Authentication → URL Configuration) to include `http://localhost:3000`
   before testing confirmation emails.
5. **Key and table security.** Only the publishable key is used in the app
   (✅). Every future table needs **Row Level Security** turned on, with
   per-user policies.
6. **Unpinned versions.** `package.json` uses `"latest"` for `next`,
   `@supabase/supabase-js` and `@supabase/ssr`. Consider pinning them.
7. **No Git remote.** The repository exists only on this computer
   (branch `master`). Consider pushing to a private GitHub repo as a backup.
   `.env.local` will stay out of it automatically.

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
| `6f994d2` | Add PROJECT_STATUS.md with Supabase verification findings |
| `8adc6ef` | Add working bottom navigation with History, Scan and Settings pages |
| `0a90dbd` | Add SalahTrack dashboard with demo data |
| `b943e8b` | Initial commit from Create Next App |

---

## 8. Suggested next steps

1. ~~Create a Supabase project~~ ✅
2. ~~Create `.env.local` with URL and publishable key~~ ✅
3. ~~Verify connectivity~~ ✅
4. **Fix the auth redirects (§5.1 to §5.4):** choose public vs. protected
   pages, point sign-up to `/dashboard`, validate the `next` redirect, and
   set Site URL / Redirect URLs in the Supabase dashboard.
5. **Test sign-up, email confirmation, login and logout** with a real account.
6. **Agree on the database design** (with ChatGPT), e.g. profiles, prayer
   logs (user, date, prayer, confirmed at, source: button/NFC), NFC tags and
   settings, with Row Level Security on every table. Consider keeping the
   schema as SQL migrations with the Supabase CLI.
7. **Replace `lib/demo-data.ts`** with real reads and writes, one screen at a
   time, starting with the dashboard confirmations.
8. **NFC**, using the URL-on-tag approach above.
