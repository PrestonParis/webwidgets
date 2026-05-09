# Test Commands

## Running tests

```bash
npm test
```

Single pass — runs all tests once and exits. Use in CI or before committing.

```bash
npm run test:watch
```

Watch mode — re-runs affected tests on every file save. Use during active development.

```bash
npm run test:coverage
```

Runs all tests and generates a coverage report. Text summary prints to the terminal; HTML report opens from `coverage/index.html`.

---

## Targeting specific tests

Vitest accepts a file path or name filter as an argument. Pass it after `--`:

```bash
# Run only the inbox tests
npx vitest run tests/unit/inbox

# Run only tests whose name contains "classifyWithRules"
npx vitest run --reporter=verbose -t "classifyWithRules"

# Run a single file
npx vitest run tests/unit/search/widgetCatalog.test.ts
```

---

## Verbose output

```bash
npx vitest run --reporter=verbose
```

Shows each test name and pass/fail inline instead of the compact summary.

---

## Test layout

```
tests/
└── unit/
    ├── inbox/
    │   └── classifyWithRules.test.ts   — email rule-based classifier
    ├── search/
    │   └── widgetCatalog.test.ts       — widget catalog and keyword search
    ├── dashboard/
    │   └── dashboardLayout.test.ts     — layout hydration and persist key helpers
    └── calendar/
        └── calendarHelpers.test.ts     — event color, isAllDay, eventStart, formatEventTime
```

---

## Adding new tests

1. Create a file under `tests/unit/<feature>/` with a `.test.ts` extension.
2. Import from `@/features/...` — the `@` alias resolves to the project root.
3. Run `npm run test:watch` while writing to get instant feedback.

Keep tests in `tests/unit/` for pure logic. Anything that touches the DOM, network, or React lifecycle belongs in an integration or e2e layer (not set up yet).
