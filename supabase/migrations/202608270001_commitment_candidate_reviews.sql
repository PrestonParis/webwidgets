alter table public.candidate_actions
    add column if not exists candidate_kind text not null default 'task',
    add column if not exists reason text not null default '',
    add column if not exists extractor_version text not null default 'legacy',
    add column if not exists model_version text,
    add column if not exists approved_payload_hash text,
    add column if not exists approved_payload_version integer,
    add column if not exists reviewed_at timestamptz;

alter table public.candidate_actions
    drop constraint if exists candidate_actions_state_check;
alter table public.candidate_actions
    add constraint candidate_actions_state_check check (
        state in (
            'proposed', 'edited', 'approved', 'dismissed', 'incorrect',
            'expired', 'superseded', 'denied', 'executing', 'completed', 'failed'
        )
    ),
    add constraint candidate_actions_kind_check check (
        candidate_kind in ('task', 'calendar')
    ),
    add constraint candidate_actions_approval_binding_check check (
        (approved_payload_hash is null and approved_payload_version is null)
        or (
            approved_payload_hash = payload_hash
            and approved_payload_version = payload_version
            and state = 'approved'
        )
    );

create table public.candidate_action_evidence (
    user_id uuid not null references auth.users(id) on delete cascade,
    candidate_action_id uuid not null,
    timeline_event_id uuid not null,
    evidence_role text not null default 'supporting',
    position integer not null default 0,
    created_at timestamptz not null default now(),
    primary key (candidate_action_id, timeline_event_id),
    constraint candidate_action_evidence_candidate_owner_fk
        foreign key (candidate_action_id, user_id)
        references public.candidate_actions(id, user_id) on delete cascade,
    constraint candidate_action_evidence_event_owner_fk
        foreign key (timeline_event_id, user_id)
        references public.timeline_events(id, user_id) on delete cascade,
    constraint candidate_action_evidence_role_check check (
        evidence_role in ('primary', 'supporting', 'contradicting')
    ),
    constraint candidate_action_evidence_position_check check (position >= 0)
);

create table public.candidate_action_reviews (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    candidate_action_id uuid not null,
    decision text not null,
    payload_version integer not null,
    payload_hash text not null,
    created_at timestamptz not null default now(),
    constraint candidate_action_reviews_candidate_owner_fk
        foreign key (candidate_action_id, user_id)
        references public.candidate_actions(id, user_id) on delete cascade,
    constraint candidate_action_reviews_decision_check check (
        decision in ('edited', 'approved', 'dismissed', 'incorrect')
    ),
    constraint candidate_action_reviews_version_check check (payload_version >= 1)
);

create index candidate_action_evidence_event_idx
    on public.candidate_action_evidence(user_id, timeline_event_id);
create index candidate_action_reviews_candidate_idx
    on public.candidate_action_reviews(user_id, candidate_action_id, created_at desc);

alter table public.candidate_action_evidence enable row level security;
alter table public.candidate_action_reviews enable row level security;

create policy "candidate_action_evidence_owner"
    on public.candidate_action_evidence for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "candidate_action_reviews_owner"
    on public.candidate_action_reviews for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on table public.candidate_action_evidence from anon, authenticated;
revoke all on table public.candidate_action_reviews from anon, authenticated;
grant select, insert, update, delete on table public.candidate_action_evidence to authenticated;
grant select, insert on table public.candidate_action_reviews to authenticated;
grant all on table public.candidate_action_evidence to service_role;
grant all on table public.candidate_action_reviews to service_role;

create or replace function public.edit_candidate_action(
    p_candidate_id uuid,
    p_expected_version integer,
    p_payload jsonb,
    p_payload_hash text
) returns public.candidate_actions
language plpgsql
security invoker
set search_path = public
as $$
declare
    updated public.candidate_actions;
begin
    update public.candidate_actions
    set payload = p_payload,
        payload_hash = p_payload_hash,
        payload_version = payload_version + 1,
        state = 'edited',
        approved_payload_hash = null,
        approved_payload_version = null,
        reviewed_at = now()
    where id = p_candidate_id
      and user_id = auth.uid()
      and payload_version = p_expected_version
      and state in ('proposed', 'edited', 'approved')
      and expires_at > now()
    returning * into updated;
    if updated.id is null then raise exception 'candidate_edit_conflict'; end if;
    insert into public.candidate_action_reviews (
        user_id, candidate_action_id, decision, payload_version, payload_hash
    ) values (
        auth.uid(), updated.id, 'edited', updated.payload_version, updated.payload_hash
    );
    return updated;
end;
$$;

create or replace function public.review_candidate_action(
    p_candidate_id uuid,
    p_expected_version integer,
    p_expected_hash text,
    p_decision text
) returns public.candidate_actions
language plpgsql
security invoker
set search_path = public
as $$
declare
    updated public.candidate_actions;
begin
    if p_decision not in ('approved', 'dismissed', 'incorrect') then
        raise exception 'candidate_decision_invalid';
    end if;
    update public.candidate_actions
    set state = p_decision,
        approved_payload_hash = case when p_decision = 'approved' then payload_hash end,
        approved_payload_version = case when p_decision = 'approved' then payload_version end,
        reviewed_at = now()
    where id = p_candidate_id
      and user_id = auth.uid()
      and payload_version = p_expected_version
      and payload_hash = p_expected_hash
      and state in ('proposed', 'edited', 'approved')
      and expires_at > now()
    returning * into updated;
    if updated.id is null then raise exception 'candidate_review_conflict'; end if;
    insert into public.candidate_action_reviews (
        user_id, candidate_action_id, decision, payload_version, payload_hash
    ) values (
        auth.uid(), updated.id, p_decision, updated.payload_version, updated.payload_hash
    );
    return updated;
end;
$$;

revoke all on function public.edit_candidate_action(uuid, integer, jsonb, text) from public;
revoke all on function public.review_candidate_action(uuid, integer, text, text) from public;
grant execute on function public.edit_candidate_action(uuid, integer, jsonb, text) to authenticated;
grant execute on function public.review_candidate_action(uuid, integer, text, text) to authenticated;
