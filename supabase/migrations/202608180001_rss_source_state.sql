-- Feed-specific state for user-selected RSS/Atom integration connections.

alter table public.integration_connections
    drop constraint if exists integration_connections_user_id_provider_id_key;

alter table public.integration_connections
    add column if not exists source_url text,
    add column if not exists source_url_hash text,
    add column if not exists http_etag text,
    add column if not exists http_last_modified text,
    add column if not exists fetch_interval_minutes integer not null default 30;

alter table public.integration_connections
    add constraint integration_connections_user_provider_external_unique
        unique nulls not distinct (user_id, provider_id, external_account_id),
    add constraint integration_connections_fetch_interval_check
        check (fetch_interval_minutes between 15 and 1440) not valid,
    add constraint integration_connections_rss_source_check check (
        provider_id <> 'rss'
        or (
            source_url is not null
            and source_url_hash is not null
            and external_account_id = source_url_hash
        )
    ) not valid;

create index if not exists integration_connections_rss_schedule_idx
    on public.integration_connections(next_sync_at, id)
    where provider_id = 'rss'
      and disabled_at is null
      and disconnected_at is null;
