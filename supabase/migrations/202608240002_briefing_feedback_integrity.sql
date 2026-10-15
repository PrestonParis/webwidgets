-- Keep item-level feedback attached to the stated briefing aggregate.

alter table public.briefing_items
    add constraint briefing_items_id_briefing_user_unique
        unique (id, briefing_id, user_id);

alter table public.briefing_feedback
    add constraint briefing_feedback_item_briefing_owner_fk
        foreign key (briefing_item_id, briefing_id, user_id)
        references public.briefing_items(id, briefing_id, user_id)
        on delete cascade;
