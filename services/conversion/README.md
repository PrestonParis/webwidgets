# WebWidgets Conversion Service

Lives at `services/conversion/` in the monorepo. WebWidgets keeps cheap browser/server conversions in `apps/web/features/convert`; large or risky jobs move through this service.

## Shape

- `apps/api` — Fastify API: validates requests, stores job metadata in Postgres, generates S3 presigned URLs, enqueues BullMQ jobs.
- `apps/worker-docs` — BullMQ worker: pulls jobs, runs LibreOffice/Pandoc, uploads output to S3.
- `packages/shared` — Zod schemas, TypeScript types, and the supported conversion matrix.
- `infra/docker` — Local Redis, Postgres (with init SQL), and MinIO for development.

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `GET` | `/v1/conversions` | List supported conversion routes |
| `POST` | `/v1/jobs` | Create a job; returns presigned upload URL |
| `GET` | `/v1/jobs/:jobId` | Get job status |
| `POST` | `/v1/jobs/:jobId/start` | Enqueue the job after upload |
| `GET` | `/v1/jobs/:jobId/download` | Get presigned download URL (status=completed only) |

No paid or proprietary conversion APIs are used.

---

## Dev Runbook

### Prerequisites

- Docker Desktop running
- Node.js ≥ 20
- `npm install` run from the `services/conversion/` directory

### Step 1 — Start infra

```sh
# From repo root
docker compose -f infra/docker-compose.yml up -d conversion_redis conversion_postgres conversion_minio conversion_createbucket
```

Or start only conversion infra from the service directory:

```sh
# From services/conversion/
docker compose -f infra/docker/docker-compose.yml up -d redis postgres minio createbucket
```

The second compose file is standalone and uses its own named volumes. Use whichever is convenient.

### Step 2 — Configure the service

```sh
cp .env.example .env
```

The defaults in `.env.example` match the Docker Compose services above and need no changes for local dev.

### Step 3 — Run the API

```sh
# From services/conversion/
npm run dev:api
# Listening on http://localhost:4010
```

Verify: `curl http://localhost:4010/health` → `{"status":"ok"}`

### Step 4 — Run the worker

```sh
# From services/conversion/ in a second terminal
npm run dev:worker-docs
```

The worker connects to Redis and waits for jobs. It requires `libreoffice` and `pandoc` on the host for non-Markdown conversions. Install them if running outside Docker:

```sh
# macOS
brew install pandoc && brew install --cask libreoffice

# Debian/Ubuntu
sudo apt-get install -y libreoffice pandoc
```

For Docker-based worker, build the image from `apps/worker-docs/Dockerfile` (already includes LibreOffice and Pandoc).

To run the document worker in Docker instead of on the host:

```sh
# From services/conversion/
docker compose -f infra/docker/docker-compose.yml up -d worker_docs
```

### Step 5 — Configure WebWidgets

In `apps/web/.env`:

```sh
CONVERSION_API_URL=http://localhost:4010
NEXT_PUBLIC_CONVERSION_API_URL=   # leave empty to use the /api/conversion proxy
```

The web app routes conversion API calls through `/api/conversion` (a Next.js server-side proxy) by default. The proxy reads `CONVERSION_API_URL` (server-only). `NEXT_PUBLIC_CONVERSION_API_URL` is only needed if you want the browser to call the service directly.

### Step 6 — Test in the browser

1. Start WebWidgets: `npm run dev` from repo root.
2. Open `http://localhost:3000/convert`.
3. **Markdown → HTML (local, no service needed):** Upload a `.md` file, select HTML target, click Convert. Should complete instantly in the browser.
4. **Markdown → PDF (requires worker + API):** Upload a `.md` file, select PDF target, click Convert. The status indicator will show `queued` → `processing` → `completed`. Download link appears on completion.
5. **DOCX → PDF:** Requires LibreOffice in the worker. Upload a `.docx`, select PDF, Convert.

### Step 7 — Run the automated smoke / integration tests

Tests live in `tests/smoke/`. They do not require running infrastructure for most assertions — infra-dependent tests skip automatically when the stack is not up.

```sh
# From services/conversion/
npm test
```

To run in watch mode during development:

```sh
npm run test:watch
```

To run the full end-to-end smoke script (requires all infra + API + worker running):

```sh
# md → html (default)
npm run smoke

# md → pdf (requires pandoc + pdflatex)
SMOKE_SOURCE_EXT=md SMOKE_TARGET_EXT=pdf npm run smoke

# Against the Next.js proxy instead of direct API
CONVERSION_API_URL=http://localhost:3000/api/conversion npm run smoke
```

### Step 8 — Verify presigned upload (raw curl)

```sh
# Create a job
curl -s -X POST http://localhost:4010/v1/jobs \
  -H 'content-type: application/json' \
  -d '{"originalFileName":"test.md","sourceMime":"text/plain","sourceExtension":"md","targetExtension":"html","fileSizeBytes":28}' \
  | jq .

# Copy jobId and uploadUrl from the response, then upload
curl -s -X PUT "<uploadUrl>" \
  -H 'content-type: text/plain' \
  --data-binary '# Hello

This is a test.'

# Start the job
curl -s -X POST http://localhost:4010/v1/jobs/<jobId>/start | jq .

# Poll until completed
curl -s http://localhost:4010/v1/jobs/<jobId> | jq .status

# Get download URL
curl -s http://localhost:4010/v1/jobs/<jobId>/download | jq .downloadUrl
```

---

## Supported Document Conversions

| Source | Targets | Engine | Notes |
|---|---|---|---|
| `doc`, `docx`, `odt`, `rtf` | `pdf` | LibreOffice | Office layout fidelity is best-effort. |
| `txt` | `pdf` | Pandoc | PDF output may require a LaTeX PDF engine. |
| `html` | `pdf`, `md`, `epub` | Pandoc | TODO: HTML input is not actively sanitized before conversion. |
| `md` | `pdf`, `html`, `txt`, `epub` | Pandoc | `md` to `html` has a safe fallback if Pandoc is missing. PDF may require LaTeX. |
| `txt` | `md` | Native | Plain text is valid Markdown and is preserved unchanged. |
| `ppt`, `pptx`, `odp` | `pdf` | LibreOffice | Presentation layout fidelity is best-effort. |
| `xls`, `xlsx`, `ods` | `pdf` | LibreOffice | Spreadsheet pagination is best-effort. |
| `csv` | `xlsx`, `pdf` | LibreOffice | CSV is opened as a spreadsheet before export. |
| `xlsx` | `csv` | LibreOffice | Exports the first sheet only. TODO: add multi-sheet export packaging. |
| `epub` | `pdf`, `html` | Pandoc | Best-effort and may be lossy, especially for PDF. |

### Known Limitations

- Office layout fidelity is best-effort.
- Password-protected documents are unsupported.
- Macros are ignored and are not executed.
- `xlsx` to `csv` exports the first sheet only.
- PDF generation through Pandoc may require a LaTeX PDF engine such as `pdflatex`, `lualatex`, or `xelatex`.
- Scanned PDFs are not handled by the document worker.
- HTML input conversion currently carries a sanitizer TODO; scripts are not executed by Pandoc, but untrusted HTML should be sanitized before richer display paths use it.

---

## WebWidgets Convert Client — Manual Smoke Path

The web app's conversion client lives at `apps/web/features/convert/lib/conversionClient.ts`. It communicates through the Next.js proxy by default (`/api/conversion`), keeping the service URL and API key server-only.

To manually verify the full browser → proxy → API → worker round-trip:

1. Start everything: infra stack, API, worker, and the web app.
2. Open `http://localhost:3000/convert`.
3. Upload `tests/fixtures/sample.md`.
4. Select **Markdown → HTML** and click Convert.
   - **Expected (local path):** completes almost instantly in the browser (the md→html path uses a pure-JS renderer and does not reach the conversion service).
5. Upload `tests/fixtures/sample.md` again.
6. Select **Markdown → PDF** and click Convert.
   - **Expected (remote path):** status shows `queued` → `processing` → `completed`. A download link appears.
7. Click the download link — should produce a valid PDF.

**Confirming proxy behavior:** In the browser DevTools Network tab, conversion API calls should be to `/api/conversion/v1/...` (not `localhost:4010`). The actual `CONVERSION_API_URL` and `CONVERSION_API_KEY` are never sent to the browser.

**Confirming completed/download state:** After the job reaches `completed`, the Download button becomes active. The download URL is a presigned S3/MinIO URL that expires in 15 minutes.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `POST /v1/jobs` → 500 | Postgres unavailable | Start `conversion_postgres` container; check `DATABASE_URL` in `.env` |
| Jobs queue but never process | Redis unavailable | Start `conversion_redis`; check `REDIS_URL` in `.env` |
| Upload URL returns 403/connection refused | MinIO unavailable or bucket missing | Start `conversion_minio` + `conversion_createbucket`; check `S3_ENDPOINT` |
| Worker processes job but `outputObjectKey` missing | LibreOffice/Pandoc not installed on host | Install them (see Step 4) or run worker in Docker |
| `/api/conversion` returns 502 | API not running or `CONVERSION_API_URL` wrong | Start `npm run dev:api`; verify `CONVERSION_API_URL=http://localhost:4010` in `apps/web/.env` |
| CORS error in browser console | Calling service directly without proxy | Leave `NEXT_PUBLIC_CONVERSION_API_URL` empty so calls go through `/api/conversion` |
| `File extension does not match` error | `originalFileName` extension doesn't match `sourceExtension` | Ensure filename ends with the correct extension before uploading |
