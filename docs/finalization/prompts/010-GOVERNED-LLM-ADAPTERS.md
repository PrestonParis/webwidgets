# 010 — Implement Governed External LLM Provider Adapters

Status: Complete
Priority: Critical
Depends on: 002 and 004

## Objective

Make the existing intelligence provider registry capable of real bounded
summarization and structured reasoning without allowing external models to
control permissions, policy, or execution.

Pending Prompt 002 approval, Python is a bounded, stateless inference service
behind one authenticated container deployment. It owns no schedules, queues,
authorization policy, canonical state, or action execution; existing Python
Vercel manifests are not automatically the supported production path.

## Required investigation

- Inspect existing chatbot provider clients and reuse secure server-only SDK
  boundaries rather than adding duplicate vendor clients.
- Determine the V1 provider order and paid-tier policy in relation to ADR-001.
- Audit existing redaction, consent, inference audit, retry, and model metadata
  types.
- Identify which existing Python ML endpoints have live V1 consumers and
  which neutral fallbacks must be excluded from decisions.

## Required implementation

- Implement at least one production-capable LLM adapter behind the provider
  registry for `summarization` and structured candidate analysis; implement a
  second adapter only if fallback is a V1 requirement.
- Validate typed inputs and structured outputs. Reject malformed model output
  rather than coercing it into an action.
- Add timeouts, bounded retry, rate limits, token/cost accounting, model
  version, correlation IDs, and audit records containing redacted hashes—not
  raw private prompts.
- Enforce consent and `allowExternal`; sensitive requests must not leave the
  trusted boundary without explicit policy authorization.
- Separate untrusted source content from system instructions and add prompt-
  injection resistance tests.
- Add an abstain/failure result that downstream features can handle.
- Ensure configured-but-unimplemented providers are not reported available.
- Connect internal ML only for tasks it really supports; replace fabricated
  constant confidence with explicit fallback metadata where needed.
- Add provider-contract tests for success, malformed output, timeout,
  unavailable provider, cost/rate limit, consent denial, and malicious input.

## Non-goals

- Do not create a free-running agent loop.
- Do not allow models to call action handlers directly.
- Do not send full inboxes, documents, tokens, or unrelated context.

## Acceptance criteria

- A permitted bounded request receives typed output from a real adapter.
- A denied or sensitive request remains internal or fails explicitly.
- Prompt injection cannot change the requested schema, permission, or
  execution policy.
- Audit and cost records are useful without containing source content.
- Downstream callers can distinguish abstention, provider failure, and a
  successful low-confidence result.

## Completion handoff

The provider registry now exposes one real external provider: Anthropic through
the authenticated, stateless Python inference container. OpenAI, Gemini, and
local placeholders are no longer advertised as available. The supported
container entrypoint exposes only `/v1/ready` and `/v1/inference`; it does not
expose the legacy ML suite, own schedules, persist product state, or invoke
actions.

Next.js remains the authorization boundary. External inference requires an
authenticated user, a non-free active subscription, `allowExternal`, and
granted `external_llm`, `external_sensitive_inference`, and task-specific
consent. Requests use bounded task schemas for summarization and research
synthesis. Python authenticates the internal request, rate-limits it, separates
untrusted source payloads from fixed system instructions, validates the model
response, rejects evidence IDs outside the supplied set, and returns explicit
success, abstention, or typed failure states.

Inference audit and cost events persist request correlation, provider, model
version, token counts, estimated cost, status, and a SHA-256 input hash. They do
not persist prompts or source content. Internal ML now uses measured endpoint
confidence and abstains on neutral no-model output instead of fabricating a
constant score.

The Render Blueprint includes the free `webwidgets-v1-inference` container.
Deployment requires `INFERENCE_SERVICE_URL` in Vercel, matching
`ML_SERVICE_TOKEN` values in Render and Vercel, plus `ANTHROPIC_API_KEY` and
current per-million-token prices in Render. The
free service can sleep, so continuous production availability remains a later
operations upgrade. Prompt 011 and Prompt 012 are now available.
