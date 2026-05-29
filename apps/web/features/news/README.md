# News + Event Intelligence Foundation

Iteration 1 establishes the reusable event path that future widgets, providers, and agents can consume:

- `schemas/` owns Zod contracts for raw, normalized, enriched, ranked, timeline, and actionable events. `drizzle-zod` is wired through `normalizedEventTable` so database-facing event records share the same validation posture.
- `normalization/` uses `neverthrow` to keep malformed external payload handling explicit and composable.
- `ingestion/` introduces provider adapters. RSS uses `rss-parser` plus `@mozilla/readability`; providers are scheduled behind `bottleneck` so adapter-level rate limits are a first-class concern.
- `queues/` uses `bullmq` with `ioredis` when `REDIS_URL` is present, and degrades loudly through `pino` logging when Redis is not configured.
- `ranking/` keeps scoring modular so future personalization or ML rankers can replace the current factors.
- `search/` uses `flexsearch` for local feed search. Semantic search can later attach beside it through pgvector, Chroma, Pinecone, or another vector backend.
- `hooks/` uses TanStack Query for feed fetch state, refresh coordination, and stale-cache behavior. `superjson` is used over plain JSON on the API boundary so richer temporal feed state can move across the wire later without changing the client contract.

Library choices were intentionally single-path: BullMQ over workflow engines for a lightweight Redis queue foundation, Bottleneck over p-queue for provider rate limiting, FlexSearch over MiniSearch for fast client indexing, and neverthrow over thrown parser errors for pipeline resilience. Future orchestration candidates such as Trigger.dev, Inngest, LangChain, AI SDK/Instructor enrichment, bull-board queue visibility, OpenTelemetry spans, and pgvector-backed retrieval are extension points, not dependencies in the critical path yet.
