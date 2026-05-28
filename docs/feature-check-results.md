# Feature Check Results

Generated: 2026-05-26

---

## accessibility

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/accessibility


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/accessibility

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## actions

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/actions


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/actions

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── ESLint Violations (2) ──
🔴  apps/web/features/actions/engine/actionEngine.ts:118:61  [import/no-cycle]
   Dependency cycle detected.
🔴  apps/web/features/actions/queue/actionQueue.ts:89:52  [import/no-cycle]
   Dependency cycle detected.

─────────────────────────────────────────────────
Total: 2 issues  (🔴 2 errors  🟡 0 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## activity

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/activity


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/activity

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## admin

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/admin


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/admin

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## analytics

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/analytics


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/analytics

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## audit

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/audit


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/audit

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## auth

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/auth


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/auth

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## automation

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/automation


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/automation

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## backend

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/backend


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/backend

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## billing

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/billing


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/billing

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## calculator

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/calculator


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/calculator

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## calendar

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/calendar


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/calendar

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## chatbot

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/chatbot


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/chatbot

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## chess

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/chess


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/chess

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── ESLint Violations (1) ──
🟡  apps/web/features/chess/review/hooks/useChessGame.ts:7:7  [@typescript-eslint/no-unused-vars]
   'chessGameSchema' is assigned a value but never used.

─────────────────────────────────────────────────
Total: 1 issues  (🔴 0 errors  🟡 1 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## collaboration

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/collaboration


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/collaboration

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## context

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/context


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/context

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── ESLint Violations (3) ──
🟡  apps/web/features/context/components/ContextPermissionsPanel.tsx:3:10  [@typescript-eslint/no-unused-vars]
   'useEffect' is defined but never used.
🔴  apps/web/features/context/hooks/useContextGraph.ts:52:14  [react-hooks/set-state-in-effect]
   Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/prestonparis/Projects/dashboard/apps/web/features/context/hooks/useContextGraph.ts:52:14
  50 |     useEffect(() => {
  51 |         if (status !== 'authenticated') return;
> 52 |         void refresh();
     |              ^^^^^^^ Avoid calling setState() directly within an effect
  53 |     }, [status]);
  54 |
  55 |     const upsert = useCallback(async (payload: UpsertEntryPayload) => {
🟡  apps/web/features/context/hooks/useContextGraph.ts:53:8  [react-hooks/exhaustive-deps]
   React Hook useEffect has a missing dependency: 'refresh'. Either include it or remove the dependency array.
     💡 Missing or extra dependency in useEffect/useCallback — see https://react.dev/learn/removing-effect-dependencies

─────────────────────────────────────────────────
Total: 3 issues  (🔴 1 errors  🟡 2 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## convert

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/convert


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/convert

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## countdown

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/countdown


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/countdown

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## creative

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/creative


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/creative

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── ESLint Violations (2) ──
🔴  apps/web/features/creative/hooks/useCreativeStudio.ts:76:14  [react-hooks/set-state-in-effect]
   Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/prestonparis/Projects/dashboard/apps/web/features/creative/hooks/useCreativeStudio.ts:76:14
  74 |
  75 |     useEffect(() => {
> 76 |         void fetchProjects();
     |              ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  77 |     }, [fetchProjects]);
  78 |
  79 |     useEffect(() => {
🔴  apps/web/features/creative/hooks/useCreativeStudio.ts:80:37  [react-hooks/set-state-in-effect]
   Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/prestonparis/Projects/dashboard/apps/web/features/creative/hooks/useCreativeStudio.ts:80:37
  78 |
  79 |     useEffect(() => {
> 80 |         if (selectedProjectId) void fetchLayers(selectedProjectId);
     |                                     ^^^^^^^^^^^ Avoid calling setState() directly within an effect
  81 |     }, [selectedProjectId, fetchLayers]);
  82 |
  83 |     const createProject = useCallback(async (data: { title: string; description?: string; format?: string }) => {

─────────────────────────────────────────────────
Total: 2 issues  (🔴 2 errors  🟡 0 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## currency

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/currency


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/currency

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## dashboard

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/dashboard


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/dashboard

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── ESLint Violations (7) ──
🟡  apps/web/features/dashboard/components/freeCanvasUtils.ts:44:13  [@typescript-eslint/no-unused-vars]
   'glueGroupId' is assigned a value but never used.
🟡  apps/web/features/dashboard/components/freeCanvasUtils.ts:49:13  [@typescript-eslint/no-unused-vars]
   'weaveGroupId' is assigned a value but never used.
🟡  apps/web/features/dashboard/hooks/useDashboardSnapshot.ts:34:11  [@typescript-eslint/no-unused-vars]
   'widgetKey' is assigned a value but never used.
🔴  apps/web/features/dashboard/hooks/useDashboardSnapshot.ts:101:14  [react-hooks/set-state-in-effect]
   Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/prestonparis/Projects/dashboard/apps/web/features/dashboard/hooks/useDashboardSnapshot.ts:101:14
   99 |
  100 |     useEffect(() => {
> 101 |         void refresh();
      |              ^^^^^^^ Avoid calling setState() directly within an effect
  102 |     }, [requestKey, widgets]);
  103 |
  104 |     return { snapshot, loading, error, refresh };
🟡  apps/web/features/dashboard/hooks/useDashboardSnapshot.ts:102:8  [react-hooks/exhaustive-deps]
   React Hook useEffect has a missing dependency: 'refresh'. Either include it or remove the dependency array.
     💡 Missing or extra dependency in useEffect/useCallback — see https://react.dev/learn/removing-effect-dependencies
🟡  apps/web/features/dashboard/hooks/useFreeCanvasRelations.ts:200:29  [@typescript-eslint/no-unused-vars]
   'weaveGroupId' is assigned a value but never used.
🔴  apps/web/features/dashboard/hooks/useTrackers.ts:56:13  [react-hooks/set-state-in-effect]
   Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

/Users/prestonparis/Projects/dashboard/apps/web/features/dashboard/hooks/useTrackers.ts:56:13
  54 |     useEffect(() => {
  55 |         if (!user?.id) {
> 56 |             setTrackers([]);
     |             ^^^^^^^^^^^ Avoid calling setState() directly within an effect
  57 |             return;
  58 |         }
  59 |

─────────────────────────────────────────────────
Total: 7 issues  (🔴 2 errors  🟡 5 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## datahealth

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/datahealth


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/datahealth

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## developer

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/developer


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/developer

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── ESLint Violations (3) ──
🟡  apps/web/features/developer/DeveloperPage.tsx:233:42  [react-hooks/incompatible-library]
   Compilation Skipped: Use of incompatible library

This API returns functions which cannot be memoized without leading to stale UI. To prevent this, by default React Compiler will skip memoizing this component/hook. However, you may see issues if values from this API are passed to other components/hooks that are memoized.

/Users/prestonparis/Projects/dashboard/apps/web/features/developer/DeveloperPage.tsx:233:42
  231 |         },
  232 |     });
> 233 |     const selectedMethod = useMemo(() => form.watch('method'), [form]);
      |                                          ^^^^ React Hook Form's `useForm()` API returns a `watch()` function which cannot be memoized safely.
  234 |
  235 |     async function onSubmit(input: ApiTesterRequest) {
  236 |         setLoading(true);
🟡  apps/web/features/developer/DeveloperPage.tsx:584:39  [react-hooks/incompatible-library]
   Compilation Skipped: Use of incompatible library

This API returns functions which cannot be memoized without leading to stale UI. To prevent this, by default React Compiler will skip memoizing this component/hook. However, you may see issues if values from this API are passed to other components/hooks that are memoized.

/Users/prestonparis/Projects/dashboard/apps/web/features/developer/DeveloperPage.tsx:584:39
  582 |     );
  583 |     const parentRef = useRef<HTMLDivElement | null>(null);
> 584 |     const virtualizer = useMemo(() => useVirtualizer({
      |                                       ^^^^^^^^^^^^^^ TanStack Virtual's `useVirtualizer()` API returns functions that cannot be memoized safely
  585 |         count: data.schema.tables.length,
  586 |         getScrollElement: () => parentRef.current,
  587 |         estimateSize: () => 90,
🔴  apps/web/features/developer/DeveloperPage.tsx:584:39  [react-hooks/rules-of-hooks]
   React Hook "useVirtualizer" cannot be called inside a callback. React Hooks must be called in a React function component or a custom React Hook function.

─────────────────────────────────────────────────
Total: 3 issues  (🔴 1 errors  🟡 2 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## feedback

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/feedback


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/feedback

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## files

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/files


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/files

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## finance

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/finance


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/finance

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── Oversized Files (1) ──
🟡  apps/web/features/finance/services/financeService.ts
   File is too large: 440 lines (limit: 300), 16 exports (limit: 12)

─────────────────────────────────────────────────
Total: 1 issues  (🔴 0 errors  🟡 1 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## form-filler

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/form-filler


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/form-filler

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## habit

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/habit


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/habit

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## help

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/help


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/help

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## import-export

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/import-export


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/import-export

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## inbox

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/inbox


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/inbox

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## integrations

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/integrations


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/integrations

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## intelligence

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/intelligence


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/intelligence

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## jobs

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/jobs


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/jobs

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## journal

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/journal


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/journal

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## knowledge

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/knowledge


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/knowledge

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## memorization

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/memorization


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/memorization

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## metrics

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/metrics


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/metrics

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── ESLint Violations (2) ──
🟡  apps/web/features/metrics/components/MetricsDataTable.tsx:34:33  [react-hooks/incompatible-library]
   Compilation Skipped: Use of incompatible library

This API returns functions which cannot be memoized without leading to stale UI. To prevent this, by default React Compiler will skip memoizing this component/hook. However, you may see issues if values from this API are passed to other components/hooks that are memoized.

/Users/prestonparis/Projects/dashboard/apps/web/features/metrics/components/MetricsDataTable.tsx:34:33
  32 |     const [sorting, setSorting] = useState<SortingState>([]);
  33 |
> 34 |     const table = useMemo(() => useReactTable({
     |                                 ^^^^^^^^^^^^^ TanStack Table's `useReactTable()` API returns functions that cannot be memoized safely
  35 |         data,
  36 |         columns,
  37 |         state: { sorting },
🔴  apps/web/features/metrics/components/MetricsDataTable.tsx:34:33  [react-hooks/rules-of-hooks]
   React Hook "useReactTable" cannot be called inside a callback. React Hooks must be called in a React function component or a custom React Hook function.

─────────────────────────────────────────────────
Total: 2 issues  (🔴 1 errors  🟡 1 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## mood

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/mood


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/mood

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## news

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/news


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/news

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── Oversized Files (1) ──
🟡  apps/web/features/news/schemas/eventSchemas.ts
   File is too large: 24 exports (limit: 12)

─────────────────────────────────────────────────
Total: 1 issues  (🔴 0 errors  🟡 1 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## notifications

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/notifications


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/notifications

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## onboarding

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/onboarding


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/onboarding

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## personalization

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/personalization


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/personalization

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## platform

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/platform


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/platform

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## pomodoro

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/pomodoro


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/pomodoro

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## privacy

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/privacy


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/privacy

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## reading

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/reading


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/reading

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## recovery

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/recovery


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/recovery

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## research

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/research


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/research

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## scratchpad

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/scratchpad


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/scratchpad

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## search

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/search


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/search

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── Oversized Files (1) ──
🟡  apps/web/features/search/lib/widgetCatalog.ts
   File is too large: 790 lines (limit: 300)

─────────────────────────────────────────────────
Total: 1 issues  (🔴 0 errors  🟡 1 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## security

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/security


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/security

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## settings

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/settings


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/settings

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## texteditor

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/texteditor


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/texteditor

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## timekeeping

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/timekeeping


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/timekeeping

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## todo

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/todo


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/todo

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## tracking

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/tracking


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/tracking

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── Oversized Files (9) ──
🟡  apps/web/features/tracking/lib/analyticsEngine.ts
   File is too large: 328 lines (limit: 300)
🟡  apps/web/features/tracking/lib/categoryConfig.ts
   File is too large: 305 lines (limit: 300)
🟡  apps/web/features/tracking/types/tracking.ts
   File is too large: 17 exports (limit: 12)
🟡  apps/web/features/tracking/lib/fitness/types.ts
   File is too large: 16 exports (limit: 12)
🟡  apps/web/features/tracking/lib/meal/mealDomain.ts
   File is too large: 22 exports (limit: 12)
🟡  apps/web/features/tracking/lib/supplements/types.ts
   File is too large: 18 exports (limit: 12)
🟡  apps/web/features/tracking/lib/meal/nutrition/analytics.ts
   File is too large: 312 lines (limit: 300)
🟡  apps/web/features/tracking/lib/meal/nutrition/normalize.ts
   File is too large: 18 exports (limit: 12)
🟡  apps/web/features/tracking/lib/meal/nutrition/types.ts
   File is too large: 19 exports (limit: 12)

─────────────────────────────────────────────────
Total: 9 issues  (🔴 0 errors  🟡 9 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## tutorials

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/tutorials


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/tutorials

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## ui

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/ui


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/ui

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## uploads

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/uploads


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/uploads

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## view

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/view


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/view

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── Oversized Files (1) ──
🟡  apps/web/features/view/schemas/viewSchemas.ts
   File is too large: 19 exports (limit: 12)

─────────────────────────────────────────────────
Total: 1 issues  (🔴 0 errors  🟡 1 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## weather

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/weather


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/weather

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## widgets

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/widgets


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/widgets

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

── Oversized Files (5) ──
🟡  apps/web/features/widgets/synthesis/actions.ts
   File is too large: 339 lines (limit: 300)
🟡  apps/web/features/widgets/synthesis/components.ts
   File is too large: 550 lines (limit: 300)
🟡  apps/web/features/widgets/synthesis/dataSources.ts
   File is too large: 576 lines (limit: 300)
🟡  apps/web/features/widgets/synthesis/widgetDefinitionSchema.ts
   File is too large: 32 exports (limit: 12)
🟡  apps/web/features/widgets/synthesis/widgetInterfaces.ts
   File is too large: 19 exports (limit: 12)

─────────────────────────────────────────────────
Total: 5 issues  (🔴 0 errors  🟡 5 warnings  🔵 0 info)
─────────────────────────────────────────────────
```

---

## workflows

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/workflows


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/workflows

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---

## worldclock

```

> webwidgets@0.1.0 check
> node --max-old-space-size=4096 $(which tsx) scripts/linting/index.ts apps/web/features/worldclock


🔍  CODEBASE ANALYSIS

   Scoped to: apps/web/features/worldclock

── Running TypeScript diagnostics…
── Running code-smell checks…
── Running props type-location checks…
── Running ESLint checks…

✅  No issues detected
```

---
