# SalahTrack: Project Status

_Last updated: 15 October 2026 · Latest commit before this update: `4f6330f`_

SalahTrack is a mobile-first, NFC-enabled Islamic prayer tracking web app.
It is connected to the Supabase project "Salah-Track". The dashboard's daily
checklist, **streaks, weekly statistics and the History calendar all use real
data from `prayer_records`**. All sample statistics have been removed. Only
the prayer *times* are still samples, and they are labelled in the app.

---

## 1. Summary

| Area | Status |
| --- | --- |
| Frontend (4 screens) | ✅ Built, committed and tested at iPhone size |
| Dashboard: today's prayers | ✅ **Real data** from `public.prayer_records` (confirm → insert, undo → delete). Code checks pass and the **logged-in test passed** (§9.4). |
| Streak, weekly chart, History page | ✅ **Real data** (§10). 40 automated tests pass. **Logged-in check passed** (§10.6). |
| Prayer times | ⚠️ Sample times, labelled "Sample times" on the dashboard |
| Supabase project connected | ✅ Yes: `Salah-Track`, verified 15 October 2026 |
| Environment variables | ✅ Set in `.env.local` (Git-ignored, not committed) |
| Authentication | ✅ Active (email + password). Redirect fixes are done (§5). Login, logout and log back in verified with a real account (§9.4). **Log out button in Settings** (§11). |
| App pages while logged out | ↪️ Redirect to `/auth/login` (intended) |
| Database tables | ✅ `public.prayer_records` (§9) and `public.nfc_tags` (§12), both created by ChatGPT, RLS on |
| Settings / profile | ✅ Real account details and a working Log out (§11). **Logged-in test passed** (§11.5). |
| NFC (Phase 5) | ✅ Tag registration (§12) and the **quick check-in** `/scan/{id}` (§13). The first real test passed: the iPhone scanned a physical tag on the live site and the prayer was saved (§13.1). Quick check-in redesign: logged-in test on the phone pending (§13.6). |
| Hosting | ✅ Live on **Vercel**, from the private GitHub repo `kareamel/Salah-Track` (branch `master`). Every push to `master` redeploys automatically. |

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
| `/dashboard` | `app/(main)/dashboard/page.tsx` | Greeting, Gregorian + Hijri date, progress ring (x/5), five prayers with Confirm/Done buttons and confirmation dialog, real current/best streak, real last-7-days chart (all **real data**). Prayer times are labelled as samples. |
| `/history` | `app/(main)/history/page.tsx` | Month calendar (complete / partial / none), previous-month browsing, month totals, and a day view listing which prayers were recorded and when (**real data**) |
| `/scan` | `app/(main)/scan/page.tsx` | "Ready to scan" screen with animated scanning state and a "How it works" guide (no real NFC) |
| `/settings` | `app/(main)/settings/page.tsx` | Real account details (email, verified status, member since, last sign-in, sign-in method), **Log out**, prayer tracking info, **NFC tag registration** (§12) and About. Unfinished features are labelled "Coming soon" with no fake controls. |
| `/scan/{id}` | `app/(main)/scan/[id]/page.tsx` → `components/salahtrack/scan-check-in.tsx` | **NFC quick check-in:** checks the tag belongs to you, suggests the next unrecorded prayer with one large **Yes, I prayed** button, "Choose another prayer", success and all-done screens, today's progress (§13) |

Shared code:

| File | Purpose |
| --- | --- |
| `app/(main)/layout.tsx` | Shared background, page width and bottom nav; sets page title "SalahTrack" |
| `components/salahtrack/bottom-nav.tsx` | Bottom navigation (Home, History, Scan, Settings) with active-tab highlight |
| `components/salahtrack/auth-guard.tsx` | Sends the user to login if they log out in another tab or return with the Back button after logging out |
| `components/salahtrack/settings-sections.tsx` | Settings sections: Account, Prayer tracking, NFC bracelet, About |
| `lib/account.ts` | Loads the signed-in user's real account details and signs out |
| `lib/use-today-prayers.ts` | Shared hook: today's checklist with load / confirm / undo. Used by the dashboard and NFC check-in. |
| `components/salahtrack/prayer-checklist.tsx` | Shared prayer row, skeleton, load error and prayer confirmation dialog |
| `components/salahtrack/confirm-sheet.tsx` | Generic bottom-sheet confirmation dialog (prayers, NFC tag removal) |
| `components/salahtrack/toast.tsx` | Floating success/error message |
| `components/salahtrack/nfc-registration.tsx` | Settings → NFC: register, copy, open, remove |
| `components/salahtrack/check-in.tsx` | Quick check-in display pieces: confirm card, choose-another, success, all-recorded, progress strip, tag-not-found, skeleton |
| `lib/prayer-suggestion.ts` | **Which prayer to suggest** (currently: next unrecorded, in daily order). Kept separate so it can be swapped for real prayer times later. |
| `lib/nfc-tags.ts` | Reads, registers and removes the user's row in `nfc_tags`; checks that a tag is the user's own |
| `lib/nfc-link.ts` | Pure helpers: tag-id (UUID) check and `/scan/{id}` link building |
| `lib/safe-redirect.ts` | Shared "only redirect inside the app" check (login form and email confirm route) |
| `supabase/schema/nfc_tags.sql` | Reference copy of the `nfc_tags` schema. **Already applied, do not run.** |
| `components/salahtrack/ui.tsx` | Shared animation/card styles, `PageHeader`, `SampleBadge`, `InlineError`, `LoadStatus` |
| `components/salahtrack/stats-cards.tsx` | Streak card and weekly chart card (loading / error / empty / ready states) |
| `components/salahtrack/history-calendar.tsx` | Month calendar grid, legend and selected-day details |
| `lib/prayer-names.ts` | The five prayer names (shared by the app and the tests) |
| `lib/prayers.ts` | The five prayers with display details (Arabic, icons, sample times) |
| `lib/prayer-records.ts` | Reads, adds and deletes the user's rows in `prayer_records`. Paginated history queries and the account start date. Friendly error messages. |
| `lib/prayer-stats.ts` | **Pure statistics functions:** day grouping, current/longest streak, last 7 days, month calendar |
| `lib/prayer-stats.test.ts` | 40 automated tests (`npm test`) |
| `lib/local-date.ts` | Local calendar-date helpers (`toLocalDateString`, `addDays`, month helpers). Time-zone and summer-time safe. |
| `lib/use-today.ts` | React hook: today's date in the user's time zone, updated after midnight |
| `supabase/schema/prayer_records.sql` | Reference copy of the table's schema. **Already applied, do not run.** |

Behaviour notes:

- Today's prayer confirmations, streaks, weekly stats and History come from
  Supabase. Settings switches and the scan button are still visual only.
- Prayer times are fixed sample values, not calculated for a location. They
  are labelled "Sample times" on the dashboard.
- Settings shows the signed-in account and has a Log out button (§11).
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

Database tables: `public.prayer_records` (see §9). The `supabase/` folder
holds only a reference schema (`supabase/schema/`). There are no Supabase CLI
migrations or config yet.

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
| `4f6330f` | Add NFC tag registration and /scan/[id] check-in page |
| `a8da83c` | Record passing Settings and Log out test in PROJECT_STATUS.md |
| `78b4c4a` | Add real account Settings page with Log out |
| `6e8e7b3` | Record passing logged-in statistics check in PROJECT_STATUS.md |
| `0252cac` | Add real streaks, weekly statistics and History calendar |
| `b039b38` | Record passing logged-in test in PROJECT_STATUS.md |
| `517762e` | Connect dashboard prayer checklist to Supabase prayer_records |
| `8cb2a3e` | Fix auth redirects and open redirect in email confirm route |
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
6. ~~Create the first table (`prayer_records`)~~ ✅ (ChatGPT, §9)
7. ~~Connect the dashboard's daily checklist to `prayer_records`~~ ✅ (§9)
8. ~~Live test of the dashboard while logged in~~ ✅ (§9.4)
9. ~~Real statistics: streak, weekly chart and History~~ ✅ (§10).
   Logged-in check passed (§10.6).
10. ~~Settings/profile with Log out~~ ✅ (§11). Logged-in test passed (§11.5).
11. ~~NFC tags table~~ ✅ (ChatGPT, §12). Further tables (e.g. settings) as
    agreed, with RLS on every table. Consider Supabase CLI migrations.
12. ~~NFC registration + `/scan/{id}` check-in~~ ✅ (§12). ~~Deploy to Vercel
    and write a physical tag~~ ✅ (§13.1).
13. ~~Quick check-in redesign~~ ✅ (§13). **Next:** deploy it (`git push`)
    and test with the bracelet (§13.6).
14. **Location-based prayer times** (separate phase). Then the check-in
    suggestion can switch to the current prayer (§13.3).

---

## 9. Prayer records integration (15 October 2026)

### 9.1 Database table (created by ChatGPT, not by this repo)

`public.prayer_records`: `id` uuid PK · `user_id` uuid → `auth.users`,
default `auth.uid()` · `prayer_date` date (required) · `prayer_name` text
(Fajr/Dhuhr/Asr/Maghrib/Isha) · `completed_at` timestamptz default `now()`.
One record per user + prayer + date. RLS is on. Authenticated users have
SELECT/INSERT/DELETE on their own rows. No UPDATE. No anon access.

Reference SQL: `supabase/schema/prayer_records.sql`. It was written from the
specification and **not executed**. Constraint and policy names may differ
from the live database.

Checked from outside with the publishable key (no login):

| Test | Result |
| --- | --- |
| Logged-out SELECT | 401 `42501` permission denied ✅ |
| Logged-out INSERT | 401 `42501` permission denied ✅ (nothing written) |

### 9.2 How the dashboard uses it

| User action | What happens |
| --- | --- |
| Opens `/dashboard` | Loads the user's rows where `prayer_date` = today's **local** date. Skeleton rows show while loading. On failure, a friendly message with **Try again**. |
| Taps **Confirm** on an incomplete prayer | Dialog: "Did you pray Asr?" Nothing is saved until **Yes, I prayed Asr** is tapped. |
| Confirms | `INSERT { prayer_date, prayer_name }` (`user_id` filled by the database). The row turns green **only after** the database returns the saved record. |
| Taps **Done** on a completed prayer | Dialog: "Remove Asr?" → `DELETE` by record `id`. The row reverts only after the database confirms the deletion. |
| Duplicate (e.g. confirmed in another tab) | Unique violation `23505` → "This prayer is already recorded for today." The checklist reloads from the database. |
| Undo of an already-deleted record | "That record was already removed." The checklist reloads. |
| Session expired / not allowed (`42501`, `PGRST30x`) | "Your session has expired. Please log in again." |
| Network problem | "Couldn't reach the server. Check your internet connection and try again." The dialog stays open so the user can retry. |
| App left open past midnight | The date refreshes within a minute or when the tab regains focus, then today's records reload. |

`prayer_date` comes from `toLocalDateString()` (`getFullYear`/`getMonth`/
`getDate`). `toISOString()` is not used.

### 9.3 Checks run

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | ✅ Pass |
| ESLint | ✅ Pass |
| Production build (`next build`) | ✅ Pass (18 routes) |
| Local-date logic: London, Riyadh, New York, Sydney × 00:05 / 00:30 / 23:45 | ✅ 12/12 correct (`toISOString` was wrong in 6/12) |
| Logged-out access to `/dashboard`, `/history` | ↪️ `/auth/login` (intended) |
| Dev server log | ✅ No errors |

### 9.4 Logged-in end-to-end test ✅ (project owner, 15 October 2026)

The assistant cannot create accounts or sign in, so the project owner ran
this test with their real account:

| Step | Result |
| --- | --- |
| Log in → `/dashboard` | ✅ Passed |
| Confirm a prayer → dialog → **Yes** → turns green | ✅ Passed |
| Refresh the page → still completed | ✅ Passed |
| Log out and log back in → still completed | ✅ Passed |
| Undo (**Done** → **Remove record**) → record deleted | ✅ Passed |

Not explicitly tested yet (optional): the duplicate message from two tabs,
the network-error message, and checking the row's `prayer_date` in the
Supabase Table Editor.

---

## 10. Real statistics and History (15 October 2026)

No database schema changes were made. All reads go through the existing
browser Supabase client with the user's session, so Row Level Security still
limits every query to the user's own rows.

### 10.1 Rules implemented (`lib/prayer-stats.ts`)

| Rule | Implementation |
| --- | --- |
| Complete day | All **five different** prayer names recorded for that local date. Duplicates and unknown names are ignored. |
| Current streak | Consecutive complete days. If today is complete, it counts today. If today is not complete yet, it counts back from **yesterday** (today doesn't break it until it ends). Any earlier incomplete or unrecorded day ends the streak. |
| Longest streak | Longest run of consecutive complete days in the **full** history, up to today |
| No records | Streak 0, best 0, with a "start your streak" message (no sample values) |
| Wording | A missing record is shown as "Not recorded" or "No prayers recorded", never as "missed" |
| Future-dated rows | Ignored by streaks |

### 10.2 Weekly statistics (dashboard)

- The last **7 local calendar days, including today** (oldest first).
- Per day: different prayers recorded, out of 5.
- **Completion % = recorded ÷ possible.** Possible = 5 × the days in the
  window **on or after the user's sign-up date** (`auth.users.created_at`,
  converted to the local date). New users aren't counted against days
  before they joined. If the sign-up date can't be read, all 7 days count.
  A note under the chart explains this when it applies.
- Updates straight away after Confirm/Undo: today's figures come from the live
  checklist, so no reload is needed.

### 10.3 History page

- Month calendar (Monday first). Each day shows as **All 5 recorded**
  (solid green), **Some recorded** (light green with "3/5") or **None
  recorded**. Today is bold, future days are disabled, and days before
  sign-up are greyed out.
- Previous/next month buttons. You can't go past the current month or before
  the sign-up month.
- Month totals: prayers recorded, complete days, partial days.
- Tap a day to see each prayer as recorded (with the local time it was
  recorded) or "Not recorded". Days without records show an empty state.

### 10.4 Data loading

| Need | Query |
| --- | --- |
| Dashboard streak + week | `fetchPrayerHistory()`: **all** of the user's rows, columns `prayer_date, prayer_name, completed_at` only, ordered by `prayer_date, id` |
| History month | `fetchPrayerHistory({ from, to })`: only that month's rows (`gte`/`lte` on `prayer_date`) |
| Sign-up date | `supabase.auth.getUser()` → `created_at` |

**No silent truncation:** PostgREST returns at most 1,000 rows per request
by default, and a project can set it lower. `fetchPrayerHistory` keeps
requesting the next page (`range`) until an **empty page** comes back. That
way the longest streak is always calculated from the complete history, even
if the server limit is smaller than our page size. At up to 5 rows per day,
one year is about 1,825 rows (2–3 small requests).
*Possible future optimisation (needs a schema change, not done):* a database
view or RPC that returns one row per date with its prayer count. That would
be worth discussing if histories grow large.

Logged-out check: the exact History query returns `401 42501 permission
denied` (RLS working, query well-formed). A deliberately malformed query
returns `400`.

### 10.5 Checks run

| Check | Result |
| --- | --- |
| `npm test` (Node's built-in test runner, no new libraries) | ✅ **40/40 pass** |
| TypeScript (`tsc --noEmit`) | ✅ Pass |
| ESLint on `app/`, `components/`, `lib/`, `proxy.ts` | ✅ Pass |
| `npm run lint` (whole project) | ⚠️ 1 error that was already there in the starter's `tailwind.config.ts` (`require()` import). Not changed. |
| Production build (`next build`) | ✅ Pass (18 routes) |
| Visual check of all new components with test data (temporary preview page, deleted before commit) | ✅ Streak (active / zero / loading / error), weekly chart (partial week with sign-up note), calendar (complete / partial / none / selected / before sign-up / future), day details (recorded / not recorded / empty) |

Test coverage (`lib/prayer-stats.test.ts`) includes:
- local dates around **midnight** in 6 time zones (UTC−11 to UTC+14), with
  proof that `toISOString()` would get them wrong
- **incomplete current day** (keeps yesterday's streak), and the moment after
  midnight when yesterday's incomplete day breaks it
- gaps and partial days breaking a streak
- **month, year and leap-day boundaries**, and summer-time changes
- duplicates and unknown prayer names
- longest streak from older history
- the weekly window, possible-prayer counting from the sign-up date, and
  month calendar sizes (including leap February)

Tooling changes: `npm test` script added. `allowImportingTsExtensions` was
added to `tsconfig.json` so Node can run the TypeScript tests directly.
`eslint.config.mjs` now ignores Next.js's generated `.next/` folder.

### 10.6 Logged-in check ✅ (project owner, 15 October 2026)

After restarting the dev server (its cache had kept an outdated copy of
`components/salahtrack/ui.tsx`), the project owner checked the following with
their real account. Everything looked right:

| Item | Result |
| --- | --- |
| Dashboard streak card (current + best) | ✅ Passed |
| Dashboard "This week" chart and numbers | ✅ Passed |
| History calendar (days, month browsing, day details) | ✅ Passed |

---

## 11. Settings, profile and Log out (15 October 2026)

No new tables or schema changes. Uses the existing browser Supabase client
and session.

### 11.1 Account information (real data only)

Loaded with `supabase.auth.getUser()`, which is checked with the Supabase
server, not just read from the browser (`lib/account.ts`):

| Shown | Source |
| --- | --- |
| Email address | `user.email` |
| Email verified / not verified | `user.email_confirmed_at` |
| Member since | `user.created_at` |
| Last signed in | `user.last_sign_in_at` |
| Sign-in method | `user.app_metadata.provider` ("email" → "Email and password") |
| Avatar | First letter of the email address (no photo or name is invented) |

Missing fields are left out rather than filled with placeholders. There is a
loading skeleton while the account loads, and a Retry message if it can't
be loaded.

### 11.2 Log out

- **Log out** button in the Account section. It shows "Logging out…" while
  working, and a friendly message if logging out fails. It's available even
  if the account details failed to load.
- It uses the same `supabase.auth.signOut()` call as the starter's
  LogoutButton, then does a **full page load** of `/auth/login` (with
  `window.location.replace`). This clears every page and piece of data kept
  in memory, and the Settings page isn't left in the Back history.
- **Protected screens after logout:**
  - Server: `proxy.ts` already redirects every `(main)` page to
    `/auth/login` without a session. Verified while logged out:
    `/dashboard`, `/history`, `/scan` and `/settings` → `/auth/login`.
  - Browser: the new `AuthGuard` (in `app/(main)/layout.tsx`) sends the
    user to login when Supabase reports `SIGNED_OUT` (e.g. logging out in
    another tab). It also does this when a page is restored from the
    browser's back/forward memory without a session.
  - Data: even if a stale screen were shown, Row Level Security returns no
    data without a session.

### 11.3 Settings sections

| Section | Contents |
| --- | --- |
| Account | Signed-in email, verified status, member since, last signed in, sign-in method, Log out |
| Prayer tracking | Read-only facts about how tracking works today: local prayer day (with the browser's time zone), complete-day rule, confirm-before-saving. **Coming soon:** prayer times for your location, calculation method, prayer reminders. |
| NFC bracelet | Replaced in Phase 5 by real tag registration (§12.3) |
| About SalahTrack | App description (development preview) and data privacy note |

The old fake switches (reminders, Hijri date, vibration) and the fake "Guest"
card were removed. Unfinished features are plain rows with a "Coming soon"
label. They are not switches or buttons.

### 11.4 Checks run

| Check | Result |
| --- | --- |
| TypeScript | ✅ Pass |
| ESLint on `app/`, `components/`, `lib/`, `proxy.ts` | ✅ Pass |
| Production build | ✅ Pass (18 pages) |
| `npm test` | ✅ 40/40 (statistics unchanged) |
| Logged-out access to the 4 app pages | ✅ All redirect to `/auth/login` |
| Visual check with test data on a fresh production build (temporary preview page, deleted before commit) | ✅ Verified and unverified email, long email (truncates), loading, load error, logout error, "Logging out…", Coming soon rows, NFC and About sections. Long values use a stacked label/value layout so nothing is squeezed. |

### 11.5 Logged-in test ✅ (project owner, 15 October 2026)

After restarting the dev server, the project owner tested with their real
account. Everything worked:

| Step | Result |
| --- | --- |
| Settings shows the real email, verified status and dates | ✅ Passed |
| **Log out** → login page | ✅ Passed |
| Browser **Back** after logging out → no SalahTrack screen shown | ✅ Passed |
| Typing `/dashboard` while logged out → redirected to login | ✅ Passed |
| Log back in → dashboard, statistics and History work as before | ✅ Passed |

---

## 12. NFC integration, Phase 5 (15 October 2026)

Built and checked locally only. **Nothing has been deployed and no physical
tag has been written.** No schema changes: `public.nfc_tags` was created by
ChatGPT and is not recreated. The reference file is
`supabase/schema/nfc_tags.sql` (not executed).

### 12.1 How it works

1. In **Settings → NFC bracelet**, the user taps **Register NFC Tag**. That
   creates their row in `nfc_tags`. The database generates the `id` and
   fills `user_id` from the session.
2. Their link is `{site}/scan/{id}`, shown in full with **Copy NFC Link**
   and **Open link** (to test in the browser).
3. Later, that HTTPS link is written to a tag as an NDEF URL record. iPhone
   and Android open it like any link. The browser never talks to NFC hardware
   (iPhone Safari has no Web NFC).
4. Opening the link → (login if needed) → tag ownership check → today's five
   prayers → user picks a prayer → confirmation dialog → saved.

### 12.2 Security model

| Concern | How it's handled |
| --- | --- |
| A tag URL must not bypass login | `/scan/{id}` is in the protected `(main)` group. The proxy redirects logged-out visitors to `/auth/login?next=/scan/{id}`. Verified: logged-out request → **307** to `/auth/login?next=%2Fscan%2F…`. |
| Returning to the scan URL safely | The proxy stores the path in `next`. The login form only follows it if `safeNextPath()` confirms it's inside the app (same check as the email-confirm route). Tested against 10 open-redirect tricks. |
| Tag must belong to the user | `isMyNfcTag(id)` selects the id under RLS. Other users' tags and removed tags return no row, so both look exactly like "not found" (no information leak). Malformed ids are rejected before any query. |
| Registering for another account | The app never sends `user_id`. The database default `auth.uid()` and the RLS insert check prevent it. |
| One tag per user | Unique `user_id`. A duplicate insert (23505) shows "You already have a registered NFC tag" and reloads the real tag. |
| Removing a tag | Warning dialog: "Your current NFC link will stop working straight away…". Then DELETE by id under RLS. Its `/scan/{id}` then shows "This NFC link isn't linked to your account". |
| No automatic completion | The check-in page records nothing on load, suggests no prayer (no times, no "Up next"), and saves only after **Yes, I prayed X**. |
| The tag id is not proof of a physical scan | Treated as a link identifier only. Nothing assumes it was physically tapped. |
| Anonymous access | Verified while logged out: SELECT and INSERT on `nfc_tags` → **401 42501**. |

### 12.3 Settings → NFC bracelet

| State | What the user sees |
| --- | --- |
| Loading | Skeleton |
| Load error | "Couldn't load your NFC tag" + Retry |
| No tag | Explanation + **Register NFC Tag** ("Registering…" while saving, friendly error on failure) |
| Registered | Date registered, the full link (wrapped and selectable), **Copy NFC Link** ("Copied" feedback; if the clipboard is blocked, the link is selected for manual copying), **Open link**, and **Remove tag** (with warning) |
| Local link | Amber note: a localhost/http link only works on this computer; a physical tag needs the deployed HTTPS address |

### 12.4 `/scan/{id}` check-in page

| State | What the user sees |
| --- | --- |
| Checking | Skeleton (also used as the `<Suspense>` placeholder) |
| Not your tag / removed / malformed | "This NFC link isn't linked to your account" with links to Settings and Home |
| Check failed | "Couldn't check your NFC tag" + Retry |
| Verified | "Your NFC tag" badge, today's progress (x of 5, five segments), the five prayers (recorded ones show **Done** and can't be undone here), "Choose it below. Nothing is saved until you confirm." |
| After saving | "{Prayer} recorded. May Allah accept it." banner, and the progress updates straight away |

**Shared saving logic:** the dashboard's load / confirm / undo code moved
into `useTodayPrayers()` (`lib/use-today-prayers.ts`). The dashboard and
the check-in page both use it, along with the same confirmation dialog, so
duplicate handling, local dates and error messages are identical. The
dashboard's behaviour and design are unchanged.

### 12.5 Other changes

- `lib/supabase/proxy.ts`: login redirect now includes `?next=<path>`
  (applies to every protected page, so e.g. `/history` also returns there
  after login).
- `components/login-form.tsx`: after login, goes to the safe `next` path
  (default `/dashboard`).
- Bottom navigation highlights **Scan** on `/scan/{id}`. It is wrapped in
  `<Suspense>` because Next.js 16 requires it for pages with a dynamic URL.
- The `/scan` tab page itself (the demo "Start scanning" screen) is
  unchanged. It should later be replaced with instructions that point to
  the registered tag.

### 12.6 Checks run

| Check | Result |
| --- | --- |
| `npm test` | ✅ 49/49 (40 statistics + 9 new: `safe-redirect`, `nfc-link`) |
| TypeScript | ✅ Pass |
| ESLint on `app/`, `components/`, `lib/`, `proxy.ts` | ✅ Pass (`npm run lint`: only the starter's `tailwind.config.ts` issue, unchanged) |
| Production build | ✅ Pass. `/scan/[id]` builds as a partially prerendered route. |
| Logged-out `/scan/{id}`, `/dashboard`, `/settings` | ✅ 307 to `/auth/login?next=…` |
| Logged-out `nfc_tags` SELECT / INSERT | ✅ 401 42501 |
| Visual check with test data on a fresh production build (temporary page, deleted) | ✅ All NFC panel states, remove warning, check-in progress, success banner, check-in prayer rows, tag-not-found |

### 12.7 Owner browser test (pending)

**Restart the dev server first** (Ctrl+C, then `npm run dev`).

1. Settings → NFC bracelet → **Register NFC Tag** → link appears.
2. **Copy NFC Link** → paste it somewhere to check.
3. **Open link** → check-in page shows "Your NFC tag" and today's prayers.
   Record one prayer → confirm → banner + progress update. Home shows it too.
4. Log out → paste the link into the address bar → login page → log in →
   you're back on the check-in page.
5. Settings → **Remove tag** → confirm → open the old link → "isn't linked to
   your account". Register again → a **new** link is created.

---

## 13. NFC quick check-in (15 October 2026)

### 13.1 First real test (before this change)

Reported by the project owner and verified by ChatGPT in the live Supabase
database:

- The app is deployed on Vercel. Scanning the physical NFC tag with an
  iPhone opens the live `/scan/{id}` page.
- Confirming a prayer saved it permanently. The live database contains one
  prayer record and one registered NFC tag.

### 13.2 What changed

`/scan/{id}` is redesigned for speed: **scan → one tap → done**.

| Before | Now |
| --- | --- |
| A list of all five prayers, then tap one, then a confirmation popup | One prayer shown big: **"Have you completed Asr?"** with a large **"Yes, I prayed"** button. That press is the confirmation, so there's no second popup. |
| | **Choose another prayer** shows every other unrecorded prayer. Picking one swaps it into the big card (labelled "Selected prayer"). |
| Banner above the list | **Success screen** after Supabase confirms: "Asr recorded. May Allah accept it.", x of 5 recorded today, **Go to dashboard**, **Record another prayer** |
| | **All prayers recorded today** screen when all five are done |
| Progress bar | Five-prayer progress strip (Fajr … Isha, recorded ones filled) |
| Tag check, *then* load records | Tag check and today's records load **at the same time** (records are only shown once the tag is verified), so the screen appears faster |

Unchanged: the NFC URL format and the registered tag (no need to reprogram
it), registration in Settings, login and return-to-scan redirects, the
dashboard, History, statistics and Settings.

### 13.3 Suggestion logic (`lib/prayer-suggestion.ts`)

- **Next unrecorded prayer** in Fajr → Dhuhr → Asr → Maghrib → Isha order
  (the earliest prayer without a record today).
- Labelled **"Next unrecorded prayer"**, never "current prayer". The sample
  prayer times are **not** used.
- Any other unrecorded prayer can always be chosen instead.
- Returns `null` when all five are recorded, which shows the "All prayers
  recorded today" screen.
- Kept in its own pure, tested module. To add time-based suggestions later,
  add a new strategy that returns the same `{ prayer, reason, label }`
  shape. The page doesn't need to change.

### 13.4 Reliability

| Case | Handling |
| --- | --- |
| Opening the page | Nothing is saved. Saving happens only when **Yes, I prayed** is pressed. |
| Prayer already recorded | Never re-sent. `recordPrayer` refuses if today's records already contain it. If the database still reports a duplicate (e.g. saved in another tab), the friendly message appears and today's records reload. |
| Fast double-tap | A synchronous guard (`useRef`) blocks a second save while the first is in progress. The button also shows "Saving…" and is disabled. |
| Expired session | "Your session has expired…" with a **Log in again** link to `/auth/login?next=/scan/{id}`. The same applies if the session expired during the tag check. |
| Network problem | Friendly message inside the card. The button becomes **Try again**. |
| Saving logic | `recordPrayer` is a new one-tap entry in the shared `useTodayPrayers()` hook. It uses the same `addPrayerRecord` save step as the dashboard's dialog (now shared as `saveRecord`). No database changes. |

### 13.5 Checks run

| Check | Result |
| --- | --- |
| `npm test` | ✅ 56/56 (7 new suggestion tests) |
| TypeScript | ✅ Pass |
| ESLint on source | ✅ Pass (`npm run lint`: only the starter's `tailwind.config.ts` issue, unchanged) |
| Production build | ✅ Pass |
| Logged-out `/scan/{id}` (dev server) | ✅ 307 to `/auth/login?next=%2Fscan%2F…` |
| Visual check with test data on a production build (temporary page, deleted) | ✅ Quick confirm, choose another (open), progress strip, "Selected prayer", Saving…, expired-session error with Log in again, success, all recorded, loading skeleton |

### 13.6 To do: deploy and test on the phone

1. Deploy: push to GitHub (`git push`). Vercel builds and publishes
   automatically in about 1–2 minutes.
2. Scan the bracelet. The suggested prayer appears straight away. Tap **Yes,
   I prayed** and the success screen appears.
3. Try **Choose another prayer**, **Record another prayer**, and scanning
   again once all five are done ("All prayers recorded today").
