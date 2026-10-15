# SalahTrack: Project Status

_Last updated: 15 October 2026 · Latest commit before this update: `dd7d7e9`_

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
| Authentication | 🟡 Active (email + password). Redirect fixes are done (§5). **Not yet tested with a real account.** |
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

### 4.6 Authentication flows (active, untested with a real account)

| Feature | Location | Supabase call | Where the user ends up |
| --- | --- | --- | --- |
| Sign up (sends confirmation email) | `app/auth/sign-up`, `components/sign-up-form.tsx` | `auth.signUp` | Email link → `/auth/confirm?next=/dashboard` → `/dashboard` |
| Email link handler | `app/auth/confirm/route.ts` | `auth.exchangeCodeForSession` (default email template) or `auth.verifyOtp` (`{{ .TokenHash }}` template) | Validated `next` path, default `/dashboard` |
| Log in | `app/auth/login`, `components/login-form.tsx` | `auth.signInWithPassword` | `/dashboard` |
| Forgot password | `app/auth/forgot-password`, `components/forgot-password-form.tsx` | `auth.resetPasswordForEmail` | Email link → `/auth/confirm?next=/auth/update-password` |
| Set new password | `app/auth/update-password`, `components/update-password-form.tsx` | `auth.updateUser` | `/dashboard` |
| Log out | `components/logout-button.tsx` | `auth.signOut` | `/auth/login` |
| Example protected page (starter) | `app/protected` | `auth.getClaims` | Unused by SalahTrack, kept unchanged |
| Route protection | `lib/supabase/proxy.ts` | `auth.getClaims` | Logged-out visitors → `/auth/login` |

No account has been created yet. Sign-up testing is the next step (§8).

---

## 5. Authentication redirect fixes (15 October 2026)

| # | Issue | Status | What changed |
| --- | --- | --- | --- |
| 1 | App pages require login | ✅ Kept as intended | `/dashboard`, `/history`, `/scan` and `/settings` stay login-only because they will show each user's own data. `/` and `/auth/*` stay public. `lib/supabase/proxy.ts` is unchanged. |
| 2 | Sign-up landed on the starter `/protected` page | ✅ Fixed | `emailRedirectTo` is now `/auth/confirm?next=/dashboard`. Login and password-update now go to `/dashboard`. |
| 3 | Open redirect in `app/auth/confirm/route.ts` | ✅ Fixed | `next` is resolved against the app's own origin. Any value pointing to another site falls back to `/dashboard`. Error messages are now URL-encoded. |
| 4 | Supabase URL settings | ✅ Done by project owner | Site URL `http://localhost:3000` and Redirect URL `http://localhost:3000/**` (set in the dashboard; not visible to the app, so confirmed by the owner) |
| 5 | Email link format | ✅ Fixed | The confirm route now also accepts the `?code=` that Supabase's **default** email template sends, so no email-template edits are needed. `token_hash` links still work. The password-reset link now goes through the same route. |

Verification:

| Test | Result |
| --- | --- |
| TypeScript + ESLint | ✅ Pass |
| `next` = `https://evil.example`, `//evil.example`, `/\evil.example`, `\\evil.example`, tab tricks, `javascript:` | ✅ All fall back to `/dashboard` |
| `next` = `/dashboard`, `/auth/update-password`, `/history?x=1` | ✅ Allowed unchanged |
| `/auth/confirm` with no / fake link | ✅ Redirects to `/auth/error` on the same site, message encoded |
| `/`, `/auth/login`, `/auth/sign-up`, `/auth/forgot-password` | ✅ 200 |
| `/dashboard`, `/settings` while logged out | ↪️ `/auth/login` (intended) |

Remaining notes:

- **Same browser for email links.** With the default email template, the
  confirmation link should be opened in the same browser used to sign up.
  Otherwise the user is shown an error page, but the email is still confirmed
  and they can log in normally. Switching the template to `{{ .TokenHash }}`
  later removes this limit.
- **Key and table security.** Only the publishable key is used in the app
  (✅). Every future table needs **Row Level Security** turned on, with
  per-user policies.
- **Unpinned versions.** `package.json` uses `"latest"` for `next`,
  `@supabase/supabase-js` and `@supabase/ssr`. Consider pinning them.
- **No Git remote.** The repository exists only on this computer
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
| `dd7d7e9` | Update PROJECT_STATUS.md with verified Supabase connection |
| `6f994d2` | Add PROJECT_STATUS.md with Supabase verification findings |
| `8adc6ef` | Add working bottom navigation with History, Scan and Settings pages |
| `0a90dbd` | Add SalahTrack dashboard with demo data |
| `b943e8b` | Initial commit from Create Next App |

---

## 8. Suggested next steps

1. ~~Create a Supabase project~~ ✅
2. ~~Create `.env.local` with URL and publishable key~~ ✅
3. ~~Verify connectivity~~ ✅
4. ~~Fix the auth redirects~~ ✅ (§5)
5. **Test sign-up, email confirmation, login and logout** with a real account
   (project owner, in their own browser). Expected path: sign up →
   "check your email" → click link → `/dashboard` → log out → `/auth/login`
   → log in → `/dashboard`.
6. **Agree on the database design** (with ChatGPT), e.g. profiles, prayer
   logs (user, date, prayer, confirmed at, source: button/NFC), NFC tags and
   settings, with Row Level Security on every table. Consider keeping the
   schema as SQL migrations with the Supabase CLI.
7. **Replace `lib/demo-data.ts`** with real reads and writes, one screen at a
   time, starting with the dashboard confirmations.
8. **NFC**, using the URL-on-tag approach above.
