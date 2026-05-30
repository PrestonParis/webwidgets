# Pages

## Core

| Route                    | File                                 |
| ------------------------ | ------------------------------------ |
| `/`                      | `app/page.tsx`                       |
| `/onboarding`            | `app/onboarding/page.tsx`            |
| `/settings`              | `app/settings/page.tsx`              |
| `/settings/profile`      | `app/settings/profile/page.tsx`      |
| `/settings/appearance`   | `app/settings/appearance/page.tsx`   |
| `/settings/plan`         | `app/settings/plan/page.tsx`         |
| `/settings/integrations` | `app/settings/integrations/page.tsx` |
| `/personalization`       | `app/personalization/page.tsx`       |

## Productivity

| Route             | File                          |
| ----------------- | ----------------------------- | ---------------------------------------- |
| `/inbox`          | `app/inbox/page.tsx`          |
| `/tracking`       | `app/tracking/page.tsx`       |
| `/planning`       | `app/planning/page.tsx`       |
| `/journal`        | `app/journal/page.tsx`        |
| `/documents`      | `app/documents/page.tsx`      |
| `/documents/[id]` | `app/documents/[id]/page.tsx` |
| `/texteditor`     | `app/texteditor/page.tsx`     |
| `/files`          | `app/files/page.tsx`          | Hosts the Artifacts tab (see note below) |
| `/knowledge`      | `app/knowledge/page.tsx`      |
| `/context`        | `app/context/page.tsx`        |
| `/command-center` | `app/command-center/page.tsx` |
| `/automation`     | `app/automation/page.tsx`     |
| `/view`           | `app/view/page.tsx`           |

## Health & Lifestyle

| Route       | File                    |
| ----------- | ----------------------- |
| `/recovery` | `app/recovery/page.tsx` |
| `/time`     | `app/time/page.tsx`     |

## Tools & Utilities

| Route           | File                        |
| --------------- | --------------------------- |
| `/convert`      | `app/convert/page.tsx`      |
| `/weather`      | `app/weather/page.tsx`      |
| `/news`         | `app/news/page.tsx`         |
| `/finance`      | `app/finance/page.tsx`      |
| `/form-filler`  | `app/form-filler/page.tsx`  |
| `/research`     | `app/research/page.tsx`     |
| `/reading`      | `app/reading/page.tsx`      |
| `/memorization` | `app/memorization/page.tsx` |

## Creative & Learning

| Route                      | File                                   |
| -------------------------- | -------------------------------------- |
| `/chess`                   | `app/chess/page.tsx`                   |
| `/chess/[id]`              | `app/chess/[id]/page.tsx`              |
| `/chess/studies`           | `app/chess/studies/page.tsx`           |
| `/chess/studies/[studyId]` | `app/chess/studies/[studyId]/page.tsx` |

## AI & Chat

| Route   | File                |
| ------- | ------------------- |
| `/chat` | `app/chat/page.tsx` |

## Collaboration

| Route                           | File                                        |
| ------------------------------- | ------------------------------------------- |
| `/collaboration`                | `app/collaboration/page.tsx`                |
| `/collaboration/invite/[token]` | `app/collaboration/invite/[token]/page.tsx` |

## Widgets

| Route             | File                          |
| ----------------- | ----------------------------- |
| `/widgets/create` | `app/widgets/create/page.tsx` |

## Admin

| Route                  | File                               |
| ---------------------- | ---------------------------------- |
| `/admin`               | `app/admin/page.tsx`               |
| `/admin/overview`      | `app/admin/overview/page.tsx`      |
| `/admin/users`         | `app/admin/users/page.tsx`         |
| `/admin/widgets`       | `app/admin/widgets/page.tsx`       |
| `/admin/settings`      | `app/admin/settings/page.tsx`      |
| `/admin/feature-flags` | `app/admin/feature-flags/page.tsx` |
| `/admin/jobs`          | `app/admin/jobs/page.tsx`          |
| `/admin/ml`            | `app/admin/ml/page.tsx`            |
| `/admin/metrics`       | `app/admin/metrics/page.tsx`       |
| `/admin/errors`        | `app/admin/errors/page.tsx`        |
| `/admin/audit`         | `app/admin/audit/page.tsx`         |
| `/admin/actions`       | `app/admin/actions/page.tsx`       |
| `/admin/accessibility` | `app/admin/accessibility/page.tsx` |
| `/developer`           | `app/developer/page.tsx`           |

## Metrics & Observability

| Route                  | File                               |
| ---------------------- | ---------------------------------- |
| `/metrics`             | `app/metrics/page.tsx`             |
| `/metrics/overview`    | `app/metrics/overview/page.tsx`    |
| `/metrics/product`     | `app/metrics/product/page.tsx`     |
| `/metrics/events`      | `app/metrics/events/page.tsx`      |
| `/metrics/performance` | `app/metrics/performance/page.tsx` |
| `/metrics/retention`   | `app/metrics/retention/page.tsx`   |
| `/metrics/funnels`     | `app/metrics/funnels/page.tsx`     |
| `/metrics/costs`       | `app/metrics/costs/page.tsx`       |
| `/metrics/errors`      | `app/metrics/errors/page.tsx`      |
| `/metrics/actions`     | `app/metrics/actions/page.tsx`     |
| `/metrics/jobs`        | `app/metrics/jobs/page.tsx`        |
| `/metrics/ml`          | `app/metrics/ml/page.tsx`          |
| `/metrics/email`       | `app/metrics/email/page.tsx`       |
| `/metrics/widgets`     | `app/metrics/widgets/page.tsx`     |
| `/activity`            | `app/activity/page.tsx`            |
| `/datahealth`          | `app/datahealth/page.tsx`          |

## Account & Legal

| Route            | File                         |
| ---------------- | ---------------------------- |
| `/integrations`  | `app/integrations/page.tsx`  |
| `/import-export` | `app/import-export/page.tsx` |
| `/accessibility` | `app/accessibility/page.tsx` |
| `/privacy`       | `app/privacy/page.tsx`       |
| `/terms`         | `app/terms/page.tsx`         |
| `/feedback`      | `app/feedback/page.tsx`      |
| `/help`          | `app/help/page.tsx`          |

## Deprecated / Removed Routes

| Route             | Status  | Notes                                                                                                                                                                                                                                                                  |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/artifacts`      | Removed | Top-level page deleted in build-fixes commit. The Artifacts feature (DB table, API routes at `/api/artifacts`, components at `features/artifacts/`) is fully intact. Content is now accessible as a tab inside `/files`. No plans to restore the standalone route yet. |
| `/artifacts/[id]` | Removed | Same as above — detail view was part of the same deletion.                                                                                                                                                                                                             |

## Error & System

| Route                   | File                                |
| ----------------------- | ----------------------------------- |
| `/*` (not found)        | `app/not-found.tsx`                 |
| `/*` (global error)     | `app/global-error.tsx`              |
| `/auth/auth-code-error` | `app/auth/auth-code-error/page.tsx` |
