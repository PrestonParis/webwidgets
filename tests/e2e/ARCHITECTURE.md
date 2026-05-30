# Playwright E2E Testing Architecture

## Philosophy

WebWidgets is tested like an operating system/platform, not a CRUD app. The traversal system acts as a runtime auditor, architecture pressure detector, performance regression detector, slop detector, and stability validator.

## Architecture Overview

```
tests/e2e/
├── traversal/          # Route traversal and discovery
├── widgets/            # Widget runtime validation
├── dashboard/          # Dashboard-specific testing
├── integrations/       # Integration degradation testing
├── performance/        # Performance instrumentation
├── hydration/          # Hydration mismatch detection
├── auth/               # Authentication flows
├── regression/         # Regression test suites
├── fixtures/           # Test data and fixtures
├── helpers/            # Reusable test utilities
├── instrumentation/    # Runtime instrumentation
└── reports/            # Report generators
```

## Core Components

### 1. Traversal System

- **Route Discovery**: Automatic route discovery or manifest-based traversal
- **Stabilization**: Smart waits for app stabilization (network idle, hydration complete)
- **Telemetry Collection**: Load duration, console errors, failed requests, hydration warnings
- **Network Analysis**: Waterfalls, duplicate requests, long tasks, excessive re-renders

### 2. Widget Validation

- **Mount Validation**: Widget shell renders correctly
- **State Validation**: Loading, empty, error states all render
- **Exception Detection**: Unhandled exceptions caught
- **Hydration Detection**: Hydration mismatches detected
- **Viewport Batching**: Widgets validated in batches to avoid overload

### 3. Performance Instrumentation

- **Metrics**: TTFB, hydration duration, API latency, widget render duration
- **Thresholds**: Configurable performance thresholds
- **Regression Detection**: Performance regressions flagged
- **Reporting**: Top slow routes, widgets, duplicated requests

### 4. Slop Detection

- **Pattern Matching**: example.com, lorem ipsum, TODO placeholders
- **Fake Detection**: Fake integration labels, placeholder URLs, dev fallback strings
- **Empty Detection**: Empty cards with no states, broken image URLs
- **Analytics Detection**: Fake analytics/demo numbers in production paths

### 5. Hydration/Runtime Detection

- **Warnings**: Hydration warnings, client/server render mismatch
- **Mode Mismatches**: Dark mode mismatches, server-only import leakage
- **Runtime Crashes**: Runtime crashes after hydration
- **Layout Shifts**: Excessive layout shifts if practical

### 6. Request Duplication Analysis

- **Detection**: Repeated identical requests
- **Grouping**: Grouped duplicate request report
- **Source Inference**: Likely source route/component if inferable
- **Focus Areas**: Dashboard snapshot calls, auth/session requests, Supabase calls

### 7. Integration Degradation Testing

- **Degraded States**: Missing Supabase rows, disconnected integrations
- **Service Unavailability**: Go worker unavailable, analytics unavailable
- **Slow APIs**: Slow API responses
- **Graceful Degradation**: App still loads, clean empty states, no infinite loading

### 8. Dashboard-Specific Testing

- **Render Speed**: Above-fold render speed, below-fold lazy loading
- **Widget Behavior**: Hydration gating, move/reorder behavior
- **Hidden Widgets**: Hidden widget non-rendering
- **Advanced Features**: Foldered widgets, woven widgets, snapshot refresh
- **Edit Mode**: Resize/edit mode behavior

## Metadata Strategies

### Route Metadata

Routes are annotated with metadata for traversal:

```typescript
interface RouteMetadata {
  path: string;
  category: 'core' | 'feature' | 'admin' | 'experimental';
  requiresAuth: boolean;
  requiresIntegrations: string[];
  expectedLoadTime: number; // ms
  critical: boolean;
  skipReason?: string;
}
```

### Widget Metadata

Widget metadata from existing registry is enhanced:

```typescript
interface WidgetTestMetadata {
  id: string;
  type: string;
  feature: string;
  dataNeeds: string[];
  refreshPolicy: 'on-load' | 'background' | 'static';
  fallbackMode: 'error-card' | 'stale-cache' | 'empty' | 'skeleton';
  testPriority: 'critical' | 'high' | 'medium' | 'low';
  requiresAuth: boolean;
  requiresIntegrations: string[];
  expectedRenderTime: number; // ms
}
```

## Failure Categories

Failures are categorized for reporting:

- **critical**: App crashes, auth failures, core routes broken
- **degraded**: Slow loads, degraded integrations, partial failures
- **cosmetic**: Visual issues, minor UI problems
- **performance**: Performance regressions, slow routes/widgets
- **hydration**: Hydration mismatches, client/server render issues
- **network**: Failed requests, network errors, duplicate requests
- **missing-data**: Missing data, empty states without fallbacks
- **placeholder/slop**: Placeholder content, fake data, TODOs in UI

## Reporting

Reports are generated in multiple formats:

- **JSON**: Machine-readable for CI/CD integration
- **Markdown**: Human-readable for review
- **Terminal**: Quick summary for developers

## Test Tags

Tests are tagged for selective execution:

- `@traversal`: Route traversal tests
- `@widget`: Widget validation tests
- `@dashboard`: Dashboard-specific tests
- `@performance`: Performance tests
- `@hydration`: Hydration tests
- `@integration`: Integration tests
- `@regression`: Regression tests
- `@slow`: Slow-running tests
- `@critical`: Critical path tests

## Environment Awareness

Tests are environment-aware:

- **Local**: Full traversal, all integrations
- **CI**: Subset of tests, mocked integrations where needed
- **Staging**: Full traversal, staging integrations
- **Production**: Read-only traversal, no mutations

## Retry Strategy

Tests use retry-safe patterns:

- Deterministic waits where possible
- Retry on transient failures
- No brittle timing assumptions
- Stable selectors/data-testid strategy

## Parallelization

Tests are parallelized where safe:

- Independent routes run in parallel
- Widget validation batched by viewport
- Performance tests run sequentially
- Integration degradation tests run sequentially
