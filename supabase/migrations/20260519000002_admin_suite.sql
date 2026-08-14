-- Admin audit log: every destructive admin action is recorded here.
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action       text        NOT NULL,
    resource_type text       NOT NULL,
    resource_id  text,
    before       jsonb,
    after        jsonb,
    ip           text,
    user_agent   text,
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_id_idx   ON admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_resource_idx   ON admin_audit_logs(resource_type, resource_id);
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
-- Only service-role (admin client) can read/write audit logs.
CREATE POLICY "admin_audit_logs_service_only"
    ON admin_audit_logs FOR ALL
    USING (false)
    WITH CHECK (false);
-- Feature flags: key/value toggles with optional percentage rollout.
CREATE TABLE IF NOT EXISTS feature_flags (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key          text        UNIQUE NOT NULL,
    description  text        NOT NULL DEFAULT '',
    enabled      boolean     NOT NULL DEFAULT false,
    rollout_pct  integer     NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
    created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_flags_service_only"
    ON feature_flags FOR ALL
    USING (false)
    WITH CHECK (false);
-- Admin notes: freeform notes attached to users or resources.
CREATE TABLE IF NOT EXISTS admin_notes (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type text        NOT NULL,
    resource_id   text        NOT NULL,
    body          text        NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notes_service_only"
    ON admin_notes FOR ALL
    USING (false)
    WITH CHECK (false);
