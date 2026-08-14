-- Full collaboration schema: workspaces, members, invites, activity, handoffs, approvals, comments.
-- Existing workspaces/handoffs tables use IF NOT EXISTS guards so re-applying is safe.

-- ── base tables (idempotent) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collaboration_workspaces (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    scope       text        NOT NULL DEFAULT 'General',
    description text,
    status      text        NOT NULL DEFAULT 'live' CHECK (status IN ('live','idle','blocked')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS collaboration_handoffs (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id uuid        REFERENCES collaboration_workspaces(id) ON DELETE SET NULL,
    title        text        NOT NULL,
    owner        text,
    scope        text        NOT NULL DEFAULT 'General',
    priority     text        NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    due          text,
    complete     boolean     NOT NULL DEFAULT false,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
-- ── new tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_members (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid        NOT NULL REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
    user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
    email        text,                                 -- pre-join placeholder
    role         text        NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','editor','viewer','automation')),
    status       text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','removed')),
    joined_at    timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_member_identity CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_user_uniq
    ON workspace_members(workspace_id, user_id)
    WHERE user_id IS NOT NULL AND status != 'removed';
CREATE TABLE IF NOT EXISTS workspace_invites (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid        NOT NULL REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
    inviter_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email        text        NOT NULL,
    role         text        NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor','viewer')),
    token        text        NOT NULL UNIQUE,
    status       text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
    expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workspace_activity (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid        NOT NULL REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
    actor_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email  text,
    action       text        NOT NULL,
    target_type  text,
    target_id    text,
    metadata     jsonb       NOT NULL DEFAULT '{}',
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workspace_activity_ws_time
    ON workspace_activity(workspace_id, created_at DESC);
CREATE TABLE IF NOT EXISTS workspace_approvals (
    id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id        uuid        NOT NULL REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
    handoff_id          uuid        REFERENCES collaboration_handoffs(id) ON DELETE CASCADE,
    requester_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title               text        NOT NULL,
    description         text,
    status              text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
    approvals_required  integer     NOT NULL DEFAULT 1,
    approvals_received  integer     NOT NULL DEFAULT 0,
    resolved_at         timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workspace_comments (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid        NOT NULL REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
    handoff_id   uuid        REFERENCES collaboration_handoffs(id) ON DELETE CASCADE,
    author_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body         text        NOT NULL,
    parent_id    uuid        REFERENCES workspace_comments(id) ON DELETE CASCADE,
    edited       boolean     NOT NULL DEFAULT false,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workspace_comments_ws ON workspace_comments(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workspace_comments_handoff ON workspace_comments(handoff_id, created_at ASC)
    WHERE handoff_id IS NOT NULL;
-- ── RLS helper functions ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = p_workspace_id
          AND user_id = auth.uid()
          AND status = 'active'
    )
    OR EXISTS (
        SELECT 1 FROM collaboration_workspaces
        WHERE id = p_workspace_id
          AND user_id = auth.uid()
    );
$$;
CREATE OR REPLACE FUNCTION is_workspace_editor_or_owner(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = p_workspace_id
          AND user_id = auth.uid()
          AND status = 'active'
          AND role IN ('owner','editor')
    )
    OR EXISTS (
        SELECT 1 FROM collaboration_workspaces
        WHERE id = p_workspace_id
          AND user_id = auth.uid()
    );
$$;
-- ── RLS policies ─────────────────────────────────────────────────────────────

ALTER TABLE collaboration_workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspace owner access" ON collaboration_workspaces;
CREATE POLICY "workspace owner access" ON collaboration_workspaces
    FOR ALL USING (
        auth.uid() = user_id
        OR is_workspace_member(id)
    );
ALTER TABLE collaboration_handoffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "handoff access" ON collaboration_handoffs;
CREATE POLICY "handoff access" ON collaboration_handoffs
    FOR ALL USING (
        auth.uid() = user_id
        OR (workspace_id IS NOT NULL AND is_workspace_member(workspace_id))
    );
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member visibility" ON workspace_members;
CREATE POLICY "member visibility" ON workspace_members
    FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "member management" ON workspace_members;
CREATE POLICY "member management" ON workspace_members
    FOR ALL USING (is_workspace_editor_or_owner(workspace_id));
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invite editor access" ON workspace_invites;
CREATE POLICY "invite editor access" ON workspace_invites
    FOR ALL USING (is_workspace_editor_or_owner(workspace_id));
-- Token lookup for accept-invite is done via service-role (admin client) — no RLS needed for that path.

ALTER TABLE workspace_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity member read" ON workspace_activity;
CREATE POLICY "activity member read" ON workspace_activity
    FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "activity insert" ON workspace_activity;
CREATE POLICY "activity insert" ON workspace_activity
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE workspace_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "approval member access" ON workspace_approvals;
CREATE POLICY "approval member access" ON workspace_approvals
    FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "approval write" ON workspace_approvals;
CREATE POLICY "approval write" ON workspace_approvals
    FOR ALL USING (is_workspace_editor_or_owner(workspace_id));
ALTER TABLE workspace_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comment read" ON workspace_comments;
CREATE POLICY "comment read" ON workspace_comments
    FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "comment write" ON workspace_comments;
CREATE POLICY "comment write" ON workspace_comments
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "comment edit" ON workspace_comments;
CREATE POLICY "comment edit" ON workspace_comments
    FOR UPDATE USING (auth.uid() = author_id OR is_workspace_editor_or_owner(workspace_id));
DROP POLICY IF EXISTS "comment delete" ON workspace_comments;
CREATE POLICY "comment delete" ON workspace_comments
    FOR DELETE USING (auth.uid() = author_id OR is_workspace_editor_or_owner(workspace_id));
