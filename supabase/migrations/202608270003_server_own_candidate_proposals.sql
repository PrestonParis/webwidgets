revoke insert, delete on table public.candidate_actions from authenticated;
revoke insert, update, delete on table public.candidate_action_evidence from authenticated;

-- Candidate proposals are derived server records. Authenticated users retain
-- owner-scoped SELECT and the explicit edit/review RPCs only.
