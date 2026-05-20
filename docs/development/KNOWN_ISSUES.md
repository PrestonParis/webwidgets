# Known Issues & Backlog

## Development Diagrams

- Class Diagrams

## Dashboard

- First page load is slow; second load is significantly faster (caching warm-up)
- Clunky dragging into folder - works best if done quickly, suffers if done slowly
- Folders within folder
- Folder Styling
- Empty space -> Tips and Tricks, suggestions
- Yellow or Red dots next to widgets in a folder if something is actively happening with them (i.e.: Active Timer, new emails)
- Everything is too big when not in full screen.
- Everything is too big on mobile devices
- Lock position of a widget with lock icon revealed as you hover on side of widget

## ML_Service

- Widget/Action Suggestion
  - Input: What user is trying to do (natural language)
  - Output: Widget and Action suggestions (NLP)
- Email Classification
  - Input: Emails
  - Output: Label, i.e: "Finance" (Classification)
- Email Actions
  - Input: Emails
  - Output: Email Actions (Classification)
- Gauge sentiment/mood
  - Input: Mood History, Addiction Recovery Data,
  - Output:

## Recovery

### Page

- Color change settings for badges and rest of the page
- "I'm struggling" quick-action button (opens intervention flow)
- "Slip vs. relapse" distinction (avoid harsh binary resets for minor setbacks)
  - Slip settings: How many in x time period count for a relapse
- Monthly summary (clean days, relapses, longest streak, urges logged)
- Add user-defined "Why I'm quitting" and surface it during urges
- First-time onboarding flow (set addiction, goal, start date)
- Contextual "Get Help" panel (triggered by urges, streak breaks, patterns)
- Cross-tracker insights (relapse clustering, urge correlation)
- Add risk indicators (e.g., high-risk time windows based on past behavior)
- Urge frequency graph
- Time-of-day heatmap for urges
- Option to view addiction tracking as heatmap (full page)

### Widget

- No compact heatmap option for widgets
- No "I'm struggling" action from widget
- No visual indication of recent activity (feels static)
- Reset streak doesn't have confirmation pop up

### Both

- Urge logging should feed into insights (not just stored data)
- No pattern recognition surfaced to user (e.g., "you relapse after X type of urge")
- No offline/fast-feel handling (important for high-friction moments)
- Inconsistent action hierarchy (primary vs secondary buttons unclear)
- Accessibility gaps (color reliance, small targets, low emphasis states)
- Mobile layout not optimized (cards too dense, poor hierarchy)

## Chess

- Right half of screen is unused
- Stockfish integration needed

## Journal

### Page

- Color change settings needed
- Cannot quote text while inside a list
- Moving/animated background
- Unable to title entries, forces you into text editor
- Text editor size and Recent entries size needs to switch
  - Text editor should take up most of the screen

## Inbox

- When switching from manual to chatbot classification, optional batch reclassification

## Other Code Issues

- No option to edit world clock times to different countries
- Edit to-do items
- Widgets in Folder speeds
  - GET /api/gmail/inbox 200 in 8.5s
  - GET /api/chess/latest 200 in 4.6s

## Feature Scan Findings - 2026-05-09

### Load Time & Performance

- Dashboard startup duplicates auth/profile work across feature hooks. `features/auth/hooks/useAuth.ts` is called from several widgets/hooks, while `features/dashboard/hooks/useDashboardLayout.ts`, `features/dashboard/hooks/useTrackers.ts`, `features/widgets/hooks/useWidgetSettings.ts`, and feature hooks also call Supabase independently. This can create a burst of auth/profile/layout/settings queries on first load.
- Widget settings load one row at a time. `features/widgets/hooks/useWidgetSettings.ts` fetches `widget_settings` separately for each widget wrapper or widget shell, which likely turns the dashboard into many parallel Supabase requests as the number of visible widgets grows.
- Inbox widget intentionally bypasses browser caching. `features/inbox/hooks/useEmails.ts` uses `fetch(..., { cache: 'no-store' })`; the in-memory cache only helps after the first successful request in the same JS session. This matches the existing slow first-load note for `/api/gmail/inbox`.
- Calendar widget also bypasses browser caching. `features/calendar/hooks/useCalendarEvents.ts` uses `cache: 'no-store'` and then keeps only a short in-memory month cache, so a cold dashboard session still waits on the Calendar API route.
- Weather widget performs three potentially slow steps on a cold cache: geolocation permission/lookup, Open-Meteo fetch, and BigDataCloud reverse geocode. `features/weather/hooks/useWeather.ts` also waits up to 10 seconds for geolocation before resolving to a denied/error state.
- Currency rates are fetched directly from the client in `features/currency/hooks/useCurrency.ts`. There is a localStorage cache, but no shared server/API cache, request timeout, or stale-while-revalidate behavior.
- One-second timers can create constant dashboard re-renders. `features/recovery/hooks/useSecondsClean.ts`, `features/countdown/hooks/useCountdownTimer.ts`, and `features/pomodoro/hooks/usePomodoroTimer.ts` each update state every second when mounted or running.
- Recovery tracker ordering does an `order.includes` lookup for every tracker in `features/recovery/components/TrackerGrid.tsx`. This is fine for a few cards but becomes O(n²) as tracker count grows.

### General Bugs & Reliability

- `features/dashboard/hooks/useTrackers.ts` leaves `trackers` as `null` forever when there is no authenticated user because it returns before calling `setTrackers([])`. Anything waiting for `trackers !== null` can remain stuck.
- `features/widgets/hooks/useWidgetSettings.ts` leaves `loading` as `true` when `user?.id` is absent. Components currently mostly ignore that flag, but any future settings UI using it could show a permanent loading state.
- `features/auth/hooks/useAuth.ts` relies only on `onAuthStateChange` for initial status. If no initial auth event fires promptly, the root app can sit in a loading state longer than necessary; an explicit `getSession`/`getUser` bootstrap would make this more deterministic.
- `features/inbox/hooks/useEmails.ts` sets `isUnauthorized` on a 401/403 but never clears it if the user reconnects Gmail during the same session, so the inbox can stay in an unauthorized state until reload/remount.
- `features/calendar/hooks/useCalendarEvents.ts` sets `isNotConnected` on a 403 but never clears it after a successful later connection in the same hook instance.
- `features/inbox/hooks/useEmailActions.ts` marks an email batch as processed before `fetchExtractedActions` succeeds. If the request fails, the same email IDs will not retry until the key changes or the component remounts.
- `features/recovery/hooks/useTrackerTheme.ts` trusts localStorage values without validating them against `ThemeKey`/`TrackerSize`, so stale or manually edited storage can select unsupported theme or size keys.
- `features/recovery/components/TrackerGrid.tsx` parses localStorage as `string[]` without schema validation. Invalid shapes can survive in state and produce odd ordering behavior.
- `features/settings/components/AppearancePage.tsx` applies dark mode only inside that page. Other pages may flash or ignore the saved theme until this page is visited unless a global provider applies the class.
- `features/chess/analysis/hooks/useAnalysisBoard.ts` calls `setState` during render to sync controlled PGN changes. This can cause cascading renders and is risky with React Compiler/strict rendering.
- `features/mood/hooks/useMoodLog.ts` fabricates `created_at` and `updated_at` after an upsert instead of selecting them from Supabase, so the UI can show client-side timestamps that differ from stored database values.
- `features/journal/hooks/useAutosave.ts` schedules a nested timeout to clear the autosaved indicator but does not retain/clear that nested timeout on unmount.
- `features/weather/hooks/useWeather.ts` does not check `res.ok` before parsing either weather or reverse-geocode responses, so HTTP error pages are treated as invalid payloads rather than clear network/API errors.
- `features/currency/hooks/useCurrency.ts` parses localStorage with a type assertion instead of validating shape, so malformed cached data can be treated as valid rates.
