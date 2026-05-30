# Dev Environments

Two modes. Pick one before running `npm run dev`.

| Mode                | Supabase           | Docker needed | Command            |
| ------------------- | ------------------ | ------------- | ------------------ |
| **Cloud** (default) | Free cloud project | No            | `npm run dev`      |
| **Docker**          | Local instance     | Yes           | `npm run dev:full` |

Check which is currently active:

```sh
npm run env:status
```

---

## Cloud mode (default for frontend work)

Auth and the database run on a free Supabase cloud project. No Docker required.

### One-time setup

**1. Create a Supabase dev project**

Go to [supabase.com](https://supabase.com) → New project. Name it something like `webwidgets-dev`. Free tier is enough.

**2. Fill in `apps/web/.env.cloud`**

Open `apps/web/.env.cloud` and replace the three `FILL_IN` values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co        ← Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                     ← Project Settings → API → anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...                         ← Project Settings → API → service_role key
```

**3. Configure Supabase Auth**

In the Supabase dashboard → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`

In Authentication → Providers → Google:

- Enable Google, paste in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from `.env.cloud`

**4. Add the Supabase callback to Google Cloud Console**

Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs, add:

```
https://xxxx.supabase.co/auth/v1/callback
```

**5. Push the database schema**

```sh
supabase link --project-ref xxxx   # your project ref from the Supabase URL
supabase db push
```

**6. Activate and run**

```sh
npm run env:cloud
npm run dev
```

### Daily use

```sh
npm run dev   # cloud env is already active after first setup
```

---

## Docker mode (full local stack)

Use when you need the conversion service, sync worker, or want a fully offline environment.

### Switch to Docker env

```sh
npm run env:docker
npm run dev:full
```

`dev:full` starts Docker, Supabase, conversion containers, and all three services concurrently.

---

## Env file map

| File                         | Purpose                                                        | Committed |
| ---------------------------- | -------------------------------------------------------------- | --------- |
| `apps/web/.env.local`        | **Active env** — overwritten by `env:cloud` / `env:docker`     | No        |
| `apps/web/.env.cloud`        | Cloud Supabase template — fill in 3 values once                | No        |
| `apps/web/.env.local.docker` | Docker Supabase snapshot — exact copy of original `.env.local` | No        |
| `apps/web/.env.example`      | Public template with no secrets                                | Yes       |

All `.env.*` files are gitignored except `.env.example`.

---

## Switching

```sh
npm run env:cloud    # → copies .env.cloud to .env.local
npm run env:docker   # → copies .env.local.docker to .env.local
npm run env:status   # → prints current Supabase target
```

**Never point `env:cloud` at the production Supabase project.** Production credentials live only in Vercel environment variables, not in any local file.

---

## Stripe in cloud mode

`apps/web/.env.cloud` intentionally uses `sk_test_FILL_IN` as the Stripe key. Fill in a **test mode** key from the Stripe dashboard (Developers → API Keys → Secret key, toggle to Test mode). Never put `sk_live_*` in a local file.
