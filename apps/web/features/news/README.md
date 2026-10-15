# Timeline Intelligence

The historical `news` widget type and `/news` route remain stable identifiers,
but the V1 product surface is Timeline Intelligence.

The page and widget query persisted `timeline_events` through the authenticated
`/api/news/feed` boundary. Rendering never contacts RSS, email, or calendar
providers. The API enforces owner scope, bounded filters, stable cursor
pagination, current event state, and retention. It returns safe provenance
references and a separately recoverable view of `integration_connections`
health.

External titles and summaries render as bounded React text. Only HTTP(S)
provenance links are exposed. Related-story keys reveal relationships without
merging distinct events. Occurrence time remains primary; ingestion time is
shown when collection was delayed.

The older normalization, ranking, and search modules remain ingestion-domain
utilities and regression fixtures. They no longer manufacture page data or
decide whether the canonical timeline is empty.
