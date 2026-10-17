# V2 automation contract boundary

**Contract version:** `2.0`

The canonical TypeScript runtime schemas live in
`apps/web/lib/automationContracts`. This is the sanctioned cross-feature
`lib/` boundary; the placeholder packages remain untouched.

## Consumption rule

Control-plane and execution-plane callers construct one contract set with the
capability names supplied by the production registry:

```ts
const contracts = createAutomationContractSet(capabilityRegistry.names);
```

Next.js parses authenticated inputs through `contracts.web`. TypeScript
capability workers parse queue events, capability requests/results, and
verification results through `contracts.worker`. Both properties reference the
same Zod schema instances; a worker-specific copy is prohibited. Go consumers
use the versioned compatibility fixtures until V2-GO-001 introduces generated
language bindings. Unknown versions and capability names fail before dispatch.

The V1 sync worker does not import these contracts. It continues to consume
only its V1 envelope until a job class completes the ADR-027 ownership-epoch
cutover. Adding a V2 parser to the V1 worker before that cutover would blur
ownership and is outside V2-007.

## Boundary parsing

All untrusted values enter through one of four helpers:

| Helper                | Input                                                 |
| --------------------- | ----------------------------------------------------- |
| `parseApiRequest`     | HTTP request bodies and parameters                    |
| `parseQueuePayload`   | durable event and dispatch payloads                   |
| `parseProviderResult` | adapter/provider output after normalization           |
| `parseDatabaseRow`    | explicitly selected, camel-case aliased database rows |

Database queries must select exactly the fields required by the target schema,
alias snake-case columns to the contract names, and add the pinned
`contractVersion` before parsing. Strict schemas reject missing and unexpected
columns. A TypeScript cast is not a parser.

`AutomationContractValidationError` exposes only the boundary, a canonical
error code, and issue paths/codes. It never stores rejected values or Zod/provider
messages. Provider adapters map raw failures to `safeProviderError` and log only
their existing redacted diagnostics; provider response text never enters a
canonical result or client error.

## Version and serialization policy

- `2.0` is the only accepted contract version. Unknown or missing versions are
  rejected; no compatibility fallback is inferred.
- Published objective, plan, capability, event, and evidence records retain the
  version they were validated against.
- JSON serialization recursively sorts object keys after validation, producing
  stable payload bytes for hashing, fixtures, replay, and cross-runtime tests.
- Optional API fields are omitted rather than assigned `undefined`. Database
  nullability is represented with explicit `null`.
- Capability names are not registered in this library. V2-008 supplies the
  executable registry set, and the request schema rejects every name outside
  that set.

## Adding or changing a contract

Add a new immutable version instead of weakening an existing schema. Update
round-trip and invalid-input fixtures, then run the web typecheck, scoped lint,
and the V2 contract test. Worker and Go compatibility must be proven before a
producer emits the new version. Deployment of code that understands a version
does not authorize or cut over a job class.
