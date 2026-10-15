-- Preserve task ownership if a retained action request is ever removed.
alter table public.todos
    drop constraint if exists todos_source_action_request_owner_fk;
alter table public.todos
    add constraint todos_source_action_request_owner_fk
        foreign key (source_action_request_id, user_id)
        references public.action_requests(id, user_id)
        on delete set null (source_action_request_id);
