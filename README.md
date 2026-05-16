# Dashboard

A personal dashboard built with Next.js and Supabase. Aggregates tools you use daily into a single customizable layout.

## Features

- **Inbox** — Gmail integration with AI-powered email categorization (Claude) and manual override
- **Journal** — Rich-text journaling with autosave, drafts, and trash
- **Recovery** — Sobriety/streak tracker with heatmap and urge logging
- **Chess** — Game library, variation explorer, and move trainer synced from Lichess
- **Unit Converter** — Common unit conversions across categories
- **Dashboard** — Drag-and-drop widget layout persisted per user

---

## Local Development

### 1. Install dependencies

```sh
npm install
```

### 2. Set up environment variables

```sh
cp .env.example .env.local
```

Fill in the values. See `.env.example` for descriptions of each variable.

### 3. Start Supabase

Supabase provides local auth, database, and storage. **This must be running before you can log in.**

```sh
supabase start
```

The CLI will print the local keys on first run — copy `anon key` and `service_role key` into `.env.local`.

To stop: `supabase stop` (preserves data) or `supabase stop --no-backup` (wipes data).

### 4. Start the Next.js app

```sh
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## ML Service (Python / FastAPI)

The ML service handles email classification and widget suggestions. It is deployed separately to **Vercel**.

- **Production**: set `ML_SERVICE_URL` in your Vercel project's env vars to the deployed URL.
- **Local dev**: run locally with Docker or uvicorn (optional — the app falls back gracefully if unreachable).

### Run locally with Docker

```sh
docker-compose up
```

Runs the ML service at [http://localhost:8000](http://localhost:8000). Set `ML_SERVICE_URL=http://localhost:8000` in `.env.local`.

### Run locally without Docker

```sh
cd ml_service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Deploy to Vercel (separate project)

```sh
cd ml_service
vercel
```

Set root directory to `ml_service` when prompted. After deploy, copy the URL into `ML_SERVICE_URL` in the main project's Vercel env vars.

---

## Supabase Schema

```sh
supabase db pull          # sync remote schema → local migrations
supabase db push          # apply local migrations → remote
supabase gen types typescript --local > types/supabase.ts
```

---

## Deployment

The Next.js app deploys to Vercel automatically on push to `main`. Make sure all required env vars are set in the Vercel project dashboard.

See [docs/COMMANDS.md](docs/COMMANDS.md) for a full CLI reference.
