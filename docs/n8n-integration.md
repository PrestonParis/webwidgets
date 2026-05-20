# n8n Integration

n8n sits beside the widget snapshot architecture. It owns background workflow automation; it does not render widgets or orchestrate dashboard page loads.

## Ownership

- Next.js owns request/response UI, auth, route handlers, dashboard snapshots, screen orchestrators, widget manifests, data resolvers, and domain services.
- n8n owns scheduled syncs, external webhooks, async ingestion, notification pipelines, enrichment workflows, and long-running automation.
- The ML service owns inference, scoring, classification, and extraction endpoints.

## Environment

Server-only variables:

- `N8N_BASE_URL`
- `N8N_API_KEY`
- `N8N_WEBHOOK_SECRET`
- `N8N_WEBHOOK_USER_AGENT`
- `N8N_TIMEOUT_MS=10000`

Never prefix these with `NEXT_PUBLIC_`.

## Files

- `lib/n8n/n8nClient.ts` validates and triggers n8n workflows.
- `lib/n8n/verifyN8nWebhook.ts` verifies inbound n8n callbacks.
- `app/api/webhooks/n8n/route.ts` receives callbacks and routes them into feature services.
- `app/api/workflows/trigger/route.ts` supports explicit user-triggered actions and returns `202`.
- `features/workflows/server/workflowService.ts` hides n8n URLs and auth from the rest of the app.

## Add A Workflow

1. Add the workflow key to `workflowKeySchema` in `lib/n8n/n8nSchemas.ts`.
2. Add a Zod payload schema in `workflowPayloadSchemas`.
3. Add the webhook path and job type mapping in `features/workflows/server/workflowService.ts`.
4. Trigger it through `workflowService.triggerWorkflow`, not by calling n8n directly from UI code.

Dashboard resolvers should read stored data produced by workflows. They should not trigger n8n during normal page load.

## Add A Webhook Event

1. Add a payload schema in `lib/n8n/n8nSchemas.ts`.
2. Add the event to `n8nWebhookEventSchema`.
3. Route it in `handleN8nWebhookEvent`.
4. Store normalized results through feature/domain services.

## Security

- n8n API keys stay server-only.
- `/api/webhooks/n8n` requires `N8N_WEBHOOK_SECRET`.
- Optional `N8N_WEBHOOK_USER_AGENT` can further restrict callbacks.
- Inbound bodies are validated with Zod.
- Sentry context includes workflow metadata only, never raw email bodies, documents, tokens, or secrets.
- Use idempotency keys for repeated workflow delivery.

## Example Flow

Gmail message arrives -> n8n ingests and enriches it -> n8n posts `email.ingested` to `/api/webhooks/n8n` -> Next.js validates and stores normalized workflow/job data -> dashboard snapshot resolvers read stored inbox/task state -> widgets render stable typed payloads without directly calling Gmail or n8n.
