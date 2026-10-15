-- Analytics events: all user/system events funneled here + optionally to PostHog.
CREATE TABLE IF NOT EXISTS analytics_events (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    type        text        NOT NULL,
    source      text,
    metadata    jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx       ON analytics_events(type);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx    ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_source_idx     ON analytics_events(source);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_events_service_only" ON analytics_events FOR ALL USING (false) WITH CHECK (false);
-- Metric snapshots: periodic aggregated values for dashboards.
CREATE TABLE IF NOT EXISTS metric_snapshots (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key         text        NOT NULL,
    value       float       NOT NULL,
    dimensions  jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS metric_snapshots_key_idx        ON metric_snapshots(key);
CREATE INDEX IF NOT EXISTS metric_snapshots_created_at_idx ON metric_snapshots(created_at DESC);
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metric_snapshots_service_only" ON metric_snapshots FOR ALL USING (false) WITH CHECK (false);
-- Cost events: AI provider token/unit usage for cost tracking.
CREATE TABLE IF NOT EXISTS cost_events (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    provider    text        NOT NULL,
    feature     text        NOT NULL,
    units       float,
    cost_usd    float,
    metadata    jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cost_events_user_id_idx    ON cost_events(user_id);
CREATE INDEX IF NOT EXISTS cost_events_provider_idx   ON cost_events(provider);
CREATE INDEX IF NOT EXISTS cost_events_feature_idx    ON cost_events(feature);
CREATE INDEX IF NOT EXISTS cost_events_created_at_idx ON cost_events(created_at DESC);
ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cost_events_service_only" ON cost_events FOR ALL USING (false) WITH CHECK (false);
-- Performance events: route/widget/service latency measurements.
CREATE TABLE IF NOT EXISTS performance_events (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    route        text,
    source       text,
    duration_ms  float       NOT NULL,
    status       text,
    metadata     jsonb,
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS performance_events_route_idx       ON performance_events(route);
CREATE INDEX IF NOT EXISTS performance_events_source_idx      ON performance_events(source);
CREATE INDEX IF NOT EXISTS performance_events_created_at_idx  ON performance_events(created_at DESC);
ALTER TABLE performance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "performance_events_service_only" ON performance_events FOR ALL USING (false) WITH CHECK (false);
