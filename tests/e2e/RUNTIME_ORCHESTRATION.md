# Runtime Orchestration & Readiness Management

## Overview

The Playwright traversal system includes comprehensive runtime orchestration and readiness management to ensure tests verify the actual WebWidgets runtime state instead of failing due to startup orchestration gaps.

## Startup Flow

### 1. Global Setup (tests/e2e/helpers/global-setup.ts)

Before any tests run, the global setup performs:

1. **Environment Detection**
   - Detects startup mode (attached/managed/ci)
   - Logs environment info (base URL, NODE_ENV, workers, E2E mode)

2. **Runtime Diagnostics** (via RuntimeManager)
   - Checks if Next.js server port is already in use
   - Starts server if in managed mode and port not in use
   - Verifies optional services (Supabase, Redis, Go worker, ML service)
   - Performs readiness checks (Dashboard, Health, Ready endpoints)
   - Generates startup diagnostics report

3. **Failure Handling**
   - Fails fast if diagnostics fail
   - Provides clear error messages with remediation steps
   - Saves diagnostics to `tests/e2e/reports/startup-diagnostics.json`

4. **Runtime Manager Storage**
   - Stores runtime manager in global scope for cleanup

### 2. Test Execution

Tests run normally with the assurance that:

- Server is running and reachable
- Required services are available
- Readiness checks have passed

### 3. Global Teardown (tests/e2e/helpers/global-teardown.ts)

After all tests complete:

- Stops managed server if it was started
- Cleans up resources
- Logs completion

## Startup Modes

### Attached Mode (Default for Local Development)

**Environment:** `E2E_MODE=attached` or not set

**Behavior:**

- Assumes server is already running
- Checks if port is in use
- Fails if port not in use
- Does not start server automatically

**Use Case:** Local development where you manually start the dev server

**Command:**

```bash
npm run dev
npm run test:e2e:attached
```

### Managed Mode

**Environment:** `E2E_MODE=managed`

**Behavior:**

- Checks if port is in use
- Starts server automatically if port not in use
- Waits for server to be ready
- Stops server after tests complete

**Use Case:** CI/CD or automated testing where you want Playwright to manage the server lifecycle

**Command:**

```bash
npm run test:e2e:managed
```

### CI Mode

**Environment:** `CI=true`

**Behavior:**

- Automatically detected from CI environment
- Does not reuse existing servers
- Strict startup timeouts
- Deterministic behavior

**Use Case:** CI/CD pipelines

**Command:**

```bash
CI=true npm run test:e2e
```

## Required Services

### Next.js Server

**Port:** 3000 (configurable via PORT env var)

**Required:** Yes

**Checks:**

- Port is open and listening
- Server responds to HTTP requests
- Dashboard route is reachable

**Failure Mode:** Tests fail immediately with clear error message

### Environment Variables

**Required:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Checks:**

- Environment variables are loaded
- Values are not empty

**Failure Mode:** Readiness check fails, tests do not proceed

## Optional Services

### Supabase

**Port:** 54321 (default)

**Required:** No

**Checks:**

- Port is reachable
- Service is responding

**Failure Mode:** Warning logged, tests proceed

### Redis

**Port:** 6379 (default)

**Required:** No

**Checks:**

- Port is reachable
- Service is responding

**Failure Mode:** Warning logged, tests proceed

### Go Worker

**Port:** 8000 (default)

**Required:** No

**Checks:**

- Port is reachable
- Service is responding

**Failure Mode:** Warning logged, tests proceed

### ML Service

**Port:** 8000 (default)

**Required:** No

**Checks:**

- Port is reachable
- Service is responding

**Failure Mode:** Warning logged, tests proceed

## Health/Readiness Endpoints

### /api/healthz

**Purpose:** Kubernetes-style health check

**Authentication:** None (public)

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

**Use:** Basic server health verification

### /api/ready

**Purpose:** Kubernetes-style readiness check

**Authentication:** None (public)

**Response:**

```json
{
  "status": "ready",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "checks": {
    "environment": "ok",
    "server": "ok"
  }
}
```

**Use:** Verify application is ready to serve traffic

### /api/health

**Purpose:** Admin-only health check with detailed system data

**Authentication:** Required (admin only)

**Response:** Detailed system health data

**Use:** Administrative health monitoring

## Infrastructure vs Runtime Failure Separation

The traversal system distinguishes between infrastructure failures and app failures:

### Infrastructure Failures (Category: `infrastructure`)

**Examples:**

- Server not running
- Port not open
- Connection refused
- DNS resolution failure
- Network unreachable
- Server unavailable

**Detection:**

- Error message patterns (ECONNREFUSED, ENOTFOUND, ETIMEDOUT)
- Connection-level failures (status 0 or -1)
- Localhost connection failures with 5xx status

**Reporting:**

- Categorized separately from app failures
- Clear indication that this is an infrastructure issue
- Different emoji (🏗️) in reports

### Runtime Failures (Category: `critical`, `degraded`, etc.)

**Examples:**

- App crashes
- Auth failures
- Core routes broken
- Widget rendering failures
- API 4xx/5xx responses (non-infrastructure)
- Hydration mismatches

**Detection:**

- Console errors not matching infrastructure patterns
- Failed requests with app-level status codes
- Runtime exceptions

**Reporting:**

- Categorized by specific failure type
- Indicates actual application issues

## Common Failure Modes

### 1. Server Not Running

**Symptom:** Tests fail with "Port not in use" error

**Attached Mode:**

```
❌ Attached mode requires server to be running on port 3000, but port is not in use
```

**Solution:**

```bash
npm run dev
npm run test:e2e:attached
```

**Managed Mode:**

- Server starts automatically
- No manual intervention needed

### 2. Port Conflict

**Symptom:** Tests fail with "Port already in use" error

**Attached Mode:**

- If server is running, tests proceed
- If different service is on port, tests fail

**Managed Mode:**

- Reuses existing server if available
- Fails if port conflict with non-Next.js service

**Solution:**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run test:e2e:attached
```

### 3. Environment Variables Missing

**Symptom:** Readiness check fails with "Missing required environment variables"

**Solution:**

```bash
# Check .env file
cat .env

# Ensure required variables are set
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 4. Optional Service Unavailable

**Symptom:** Warning logged about service not reachable

**Impact:** Tests proceed, but features depending on service may fail

**Solution:**

- Start optional service if needed
- Or accept that some tests will fail/warn

### 5. Startup Timeout

**Symptom:** Tests fail with "Server startup timeout after 60000ms"

**Solution:**

- Increase startup timeout in global-setup.ts
- Check server logs for startup issues
- Verify system resources

### 6. Infrastructure Failure During Traversal

**Symptom:** Traversal fails with infrastructure category failures

**Detection:** Failures categorized as `infrastructure` instead of `critical` or `network`

**Solution:**

- Check server is still running
- Check network connectivity
- Verify no port conflicts during test run

## New Scripts

### dev:test

**Purpose:** Start dev server and run e2e tests in attached mode

**Command:**

```bash
npm run dev:test
```

**Behavior:**

- Starts Next.js dev server
- Waits for server to be ready (using wait-on)
- Runs e2e tests in attached mode
- Stops server after tests complete

### test:e2e:attached

**Purpose:** Run e2e tests in attached mode

**Command:**

```bash
npm run test:e2e:attached
```

**Behavior:**

- Assumes server is already running
- Checks port availability
- Fails if server not running

### test:e2e:managed

**Purpose:** Run e2e tests in managed mode

**Command:**

```bash
npm run test:e2e:managed
```

**Behavior:**

- Starts server if not running
- Waits for readiness
- Stops server after tests complete

### test:e2e:smoke

**Purpose:** Run quick smoke test

**Command:**

```bash
npm run test:e2e:smoke
```

**Behavior:**

- Runs single dashboard traversal test
- Fast validation of basic functionality

## Startup Diagnostics Report

Generated at: `tests/e2e/reports/startup-diagnostics.json`

**Contents:**

```json
{
  "mode": "attached",
  "startTime": 1234567890,
  "endTime": 1234567900,
  "duration": 10000,
  "serverStarted": true,
  "serverPort": 3000,
  "serverUrl": "http://localhost:3000",
  "services": [
    {
      "name": "Supabase",
      "required": false,
      "reachable": true,
      "port": 54321,
      "host": "localhost",
      "responseTime": 50
    }
  ],
  "readinessChecks": [
    {
      "name": "Dashboard",
      "url": "http://localhost:3000/dashboard",
      "required": true,
      "status": "pass",
      "responseTime": 200
    }
  ],
  "errors": [],
  "warnings": [],
  "success": true
}
```

## Example Startup Diagnostics Output

```
🔍 Runtime Diagnostics (attached mode)
============================================================
✅ Port 3000 is already in use
✅ Supabase reachable on localhost:54321
⚠️  Redis not reachable on localhost:6379 (optional)
⚠️  Go Worker not reachable on localhost:8000 (optional)
✅ Dashboard check passed (200ms)
✅ Health check passed (50ms)
✅ Ready check passed (30ms)
============================================================
📊 Diagnostics complete in 10000ms
✅ Success: true
❌ Errors: 0
⚠️  Warnings: 2

📝 Startup diagnostics saved to: tests/e2e/reports/startup-diagnostics.json

✅ Runtime diagnostics passed. Proceeding with tests.
```

## Strictness Preserved

The system does NOT:

- Silently skip traversal
- Weaken runtime assertions
- Auto-pass unavailable routes
- Hide boot failures
- Ignore connection errors

The system DOES:

- Fail fast on infrastructure issues
- Provide clear error messages
- Distinguish infrastructure from app failures
- Generate comprehensive diagnostics
- Maintain strict runtime validation

## Configuration

### RuntimeManager Options

```typescript
const runtimeManager = new RuntimeManager({
  mode: 'attached', // 'attached' | 'managed' | 'ci'
  port: 3000, // Server port
  host: 'localhost', // Server host
  startupTimeout: 120000, // 2 minutes
  readinessTimeout: 30000, // 30 seconds
  pollInterval: 500, // 500ms
});
```

### Playwright Config

```typescript
webServer: process.env.E2E_MODE === 'managed' ? {
  command: 'npm run dev:frontend',
  url: 'http://localhost:3000',
  port: 3000,
  timeout: 120000,
  reuseExistingServer: !process.env.CI,
  env: {
    PORT: '3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
} : undefined,
```

## Best Practices

### Local Development

1. Use attached mode for faster iteration
2. Start server manually with `npm run dev`
3. Run tests with `npm run test:e2e:attached`
4. Check startup diagnostics if tests fail

### CI/CD

1. Use managed mode or CI mode
2. Ensure environment variables are set
3. Configure appropriate timeouts
4. Review startup diagnostics in CI logs

### Debugging

1. Check `tests/e2e/reports/startup-diagnostics.json`
2. Review server logs for startup issues
3. Verify port availability
4. Check environment variables
5. Test health/readiness endpoints manually

## Troubleshooting

### Tests fail immediately with "Runtime diagnostics failed"

**Cause:** Server not running or infrastructure unavailable

**Solution:**

1. Check if server is running: `curl http://localhost:3000/api/healthz`
2. Start server if needed: `npm run dev`
3. Check port conflicts: `lsof -i:3000`
4. Review startup diagnostics report

### Tests fail with "Infrastructure failure" during traversal

**Cause:** Server stopped or became unavailable during test run

**Solution:**

1. Check server logs for crashes
2. Verify system resources
3. Check for port conflicts
4. Review network connectivity

### Optional service warnings but tests proceed

**Cause:** Optional service not running

**Solution:**

1. Start optional service if needed
2. Accept that some features may not work
3. Update test expectations if service is truly optional

### Slow startup causing timeouts

**Cause:** Server taking too long to start

**Solution:**

1. Increase startup timeout in global-setup.ts
2. Check server logs for slow initialization
3. Optimize server startup time
4. Use attached mode with pre-started server
