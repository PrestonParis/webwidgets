# 027 - ML: Command Center Orchestration Ranker

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: High

## Objective

Build an ML-backed prioritization endpoint for the Command Center. The frontend now has workstreams, live signals, action queues, scenario plans, and runtime posture. The ML service should rank which workstreams and human approvals deserve attention first.

## Context

- `features/command-center/` contains deterministic workstreams, signals, actions, and scenario planner UI.
- `app/command-center/page.tsx` is the full page route.
- `features/command-center/components/CommandCenterWidget.tsx` is on the home dashboard.
- Current ranking is deterministic by priority/status only.

## Required Implementation

1. Add `ml_service/data/command_center_training.json` with at least 500 synthetic samples:
   - `title`, `domain`, `status`, `priority`, `progress`, `blockers`, `automations`, `confidence`, `due_hours`, `attention_score`.
2. Add `ml_service/train_command_center_ranker.py`.
   - Use `ColumnTransformer` with TF-IDF for title/domain/status/priority and scaled numeric features.
   - Use `RandomForestRegressor` or `GradientBoostingRegressor`.
   - Output `models/command_center_ranker_v1.pkl` and metadata.
3. Add schemas in `ml_service/schemas.py`:
   - `CommandWorkstreamItem`
   - `CommandRankRequest`
   - `RankedCommandWorkstream`
   - `CommandRankResponse`
4. Add `POST /rank-command-workstreams` in `ml_service/main.py`.
5. Add Next proxy route `app/api/ml/rank-command-workstreams/route.ts`.
6. Wire `features/command-center/hooks/useCommandCenter.ts` to optionally call the proxy and fall back to deterministic sorting.

## Validation

- Critical blocked workstreams rank above healthy low-priority workstreams.
- Workstreams with near due dates and blockers receive higher scores.
- Command Center still renders when ML service is unavailable.
- Unit tests cover empty input, single item, and mixed priority/status cases.
