# Dashboard

A personal dashboard built with Next.js and Supabase. Aggregates tools you use daily — email, journaling, recovery tracking, chess, and unit conversion — into a single customizable layout.

## Features

- **Inbox** — Gmail integration with AI-powered email categorization (Claude) and manual override
- **Journal** — Rich-text journaling with autosave, drafts, and trash
- **Recovery** — Sobriety/streak tracker with heatmap and urge logging
- **Chess** — Game library, variation explorer, and move trainer synced from Lichess
- **Unit Converter** — Common unit conversions across categories
- **Dashboard** — Drag-and-drop widget layout persisted per user

## Stack

| Layer         | Technology                                           |
| ------------- | ---------------------------------------------------- |
| Frontend      | Next.js 16, React 19, Tailwind CSS 4                 |
| Backend       | Next.js API Routes, Supabase (Postgres + Auth + RLS) |
| AI            | Anthropic Claude Haiku (email classification)        |
| Auth          | Supabase Auth + Google OAuth                         |
| Rich text     | Tiptap                                               |
| Chess         | chess.js, react-chessboard                           |
| Drag and drop | dnd-kit                                              |

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+ (optional — legacy ML service)
- A Supabase project
- Google OAuth credentials
- An Anthropic API key

### Install

```bash
npm install
```

### Environment

Copy `.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Anthropic (email classification)
ANTHROPIC_API_KEY=

# Lichess
LICHESS_API_TOKEN=
```

### Database

Run the SQL scripts in `scripts/sql/` against your Supabase project in the order they appear within each subfolder:

```
scripts/sql/
  auth/
  inbox/
  chess/
  journal/
  recovery/
  dashboard/
```

### Run

```bash
npm run dev
```

Starts the Next.js dev server on [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/                  Next.js app router (pages + API routes)
components/           UI components grouped by feature
hooks/                Custom React hooks
types/                Shared TypeScript types
scripts/sql/          Supabase SQL migrations
ml_service/           Legacy Python classifier (superseded by Claude)
```

## Known Issues

See [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).
