# SplitEase — Deployment Guide

## Before you start

Make sure `npm run build` passes locally with no errors. This catches TypeScript
errors and missing imports before Vercel does.

```bash
npm run build
```

---

## Step 1 — Supabase production setup

### 1a. Use your production Supabase project
If you built the app against a personal/test project, consider creating a
separate **production project** in Supabase so dev data and prod data never mix.

Dashboard → New Project → give it a name like "splitease-prod"

### 1b. Run the schema

Open **SQL Editor** in your Supabase dashboard and run these files **in order**:

| File | What it does |
|---|---|
| `supabase/schema.sql` | Creates all tables and the member_balances view |
| `supabase/rls_policies.sql` | Enables Row Level Security (REQUIRED — see security section) |

If you are upgrading an existing database instead:
- `supabase/migration_v2_groups.sql`
- `supabase/migration_v3_settlements.sql`
- `supabase/rls_policies.sql`

### 1c. Grab your API keys

Dashboard → Project Settings → API

You need two values:
- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon public key** — long JWT string, safe to use in the browser

Do NOT use the **service_role** key in the frontend. It bypasses all security.

### 1d. Verify the connection

After deploying, open your live site and check that data loads. If you see a
blank page or "Failed to load", the env vars are likely wrong.

---

## Step 2 — Deploy to Vercel

### 2a. Push your code to GitHub

If you have not done this yet:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a repository on GitHub and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2b. Import on Vercel

1. Go to vercel.com and sign in with GitHub
2. Click **Add New → Project**
3. Find your repository and click **Import**
4. Vercel will auto-detect it as a Next.js project — leave all settings as-is
5. Before clicking Deploy, expand **Environment Variables**

### 2c. Set environment variables on Vercel

Add these two variables in the Vercel project settings:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-public-key` |

Set them for all three environments: **Production**, **Preview**, **Development**.

Then click **Deploy**.

### 2d. Verify the deployment

- Vercel will give you a URL like `https://splitease-abc123.vercel.app`
- Open it, go to Dashboard — data should load from Supabase
- Test: add a member, add an expense, check balances

---

## Environment variable checklist

```
NEXT_PUBLIC_SUPABASE_URL        ✓ set in Vercel
NEXT_PUBLIC_SUPABASE_ANON_KEY   ✓ set in Vercel
```

Both variables start with `NEXT_PUBLIC_` which means Next.js embeds them in
the browser bundle. This is intentional — the anon key is meant to be public.
Row Level Security (RLS) is what actually protects the data.

---

## Security basics (no auth yet)

### What is protected
- The Supabase **anon key** is safe to expose. Supabase designed it to be public.
- RLS policies (in `rls_policies.sql`) control what the anon key can and cannot do.
- Your database password and **service_role** key are never in the frontend.

### What is NOT protected (until you add auth)
- Anyone who knows your app URL can read, add, and delete all data.
- This is acceptable for a private hostel group where you share the URL only
  with your flatmates — but not for a public-facing app.

### Minimum hardening steps before sharing the URL widely
1. **Run `rls_policies.sql`** — non-negotiable, do this first.
2. **Restrict Supabase allowed origins** — Dashboard → API → Allowed Origins.
   Add only your Vercel domain (`https://your-app.vercel.app`). This prevents
   other websites from making requests with your anon key.
3. **Do not post the URL publicly** until you add authentication.

### When you add authentication (future)
- Replace the open RLS policies in `rls_policies.sql` with user-scoped ones.
- Use `supabase.auth.getUser()` in services to get the current user's group.
- Lock every query with `.eq('group_id', user.group_id)`.

---

## Common mistakes to avoid

| Mistake | What happens | Fix |
|---|---|---|
| Forgetting to set env vars on Vercel | Build passes but app crashes with "Missing Supabase env vars" | Add both vars in Vercel → Settings → Environment Variables |
| Using the `service_role` key in frontend | Full database access bypass — anyone can do anything | Only use the **anon** key in the browser |
| Not running RLS policies | Open database — anyone with the key can delete all data | Run `rls_policies.sql` immediately |
| Committing `.env.local` to git | Leaks keys in your git history | Already in `.gitignore` — never remove it |
| Running schema.sql on an existing database | Drops/recreates tables, destroys data | Use the migration files (`migration_v2_*.sql`) instead |
| Supabase free tier project pausing | App returns 500 after 1 week of no use | Visit the Supabase dashboard to unpause, or upgrade to Pro |
| Not running `npm run build` locally | TypeScript errors only appear after deployment | Always build locally before pushing |

---

## Codebase checklist before deployment

- [x] `node_modules/` in `.gitignore`
- [x] `.env.local` in `.gitignore`
- [x] `.env.local.example` committed (safe template with no real keys)
- [x] `NEXT_PUBLIC_` prefix on all browser-facing env vars
- [x] `npm run build` passes with no TypeScript errors
- [x] `reactStrictMode: true` in `next.config.js`
- [x] Viewport meta tag in `_app.tsx`
- [x] Custom 404 page (`src/pages/404.tsx`)
- [x] Supabase env validation throws a clear error message
- [ ] Run `supabase/rls_policies.sql` in Supabase SQL Editor
- [ ] Set env vars in Vercel dashboard
- [ ] Restrict Supabase allowed origins to your Vercel domain

---

## What to improve before handing the app to others

These are the most impactful next steps, in priority order:

### 1. Add authentication (highest priority)
Without a login, anyone with the URL can modify data. Use Supabase Auth:
- Email + password or magic link login
- Each user belongs to a group
- RLS policies filter data by `auth.uid()`

### 2. Restrict the Supabase allowed origins
Takes 30 seconds. Prevents other sites from using your anon key:
Dashboard → Settings → API → Add Allowed Origins → `https://your-app.vercel.app`

### 3. Add a custom domain on Vercel
`splitease-abc123.vercel.app` is not memorable. Buy a `.com` on Namecheap or
Google Domains (~$10/year) and connect it in Vercel → Domains.

### 4. Add a favicon
Create a small icon (64×64 PNG) named `favicon.ico` and put it in `public/`.
Current state: browser shows a generic blank icon.

### 5. Add per-page `<title>` tags
Currently every page shows "SplitEase" in the browser tab. Add a `<Head>`
block inside each page component:
```tsx
import Head from "next/head";
// Inside the page component:
<Head><title>Members — SplitEase</title></Head>
```

### 6. Supabase backups
Free tier: 1-day point-in-time recovery only.
Pro tier ($25/month): 7-day recovery.
Alternative: export data periodically with `pg_dump` via Supabase's database
connection string (found in Dashboard → Database → Connection String).
