# Claude Code dispatcher

The dispatcher turns explicitly approved GitHub issues into isolated Claude
Code runs. It is intentionally one-shot and single-worker in the MVP. An
external scheduler may call it repeatedly, but the dispatcher never merges or
deploys.

## Safety model

- An issue needs the `state:approved` label or `State: approved` metadata.
- `state:blocked`, `decision:required`, assigned, and claimed issues are skipped.
- A filesystem lock prevents two local dispatcher processes from claiming work.
- The approval label is replaced with `state:claimed` before Claude starts.
- Every run gets a dedicated worktree and `agent/claude/<issue>-<slug>` branch.
- Failure restores the approval label and records durable state.

Create the `state:approved` and `state:claimed` repository labels before the
first real run. Configure the explicit Claude executable path if it is not on
`PATH`:

```sh
export WW_DISPATCH_CLAUDE_BIN=/absolute/path/to/claude
```

Optional settings:

| Variable                       | Default               |
| ------------------------------ | --------------------- |
| `WW_DISPATCH_REPOSITORY`       | `PrestonParis/aidash` |
| `WW_DISPATCH_BASE_BRANCH`      | `origin/main`         |
| `WW_DISPATCH_APPROVAL_LABEL`   | `state:approved`      |
| `WW_DISPATCH_CLAIMED_LABEL`    | `state:claimed`       |
| `WW_DISPATCH_TIMEOUT_SECONDS`  | `2700`                |
| `WW_DISPATCH_CLAUDE_ARGS_JSON` | `["-p"]`              |

## Safe first run

```sh
npm run dispatcher:preflight
npm run dispatcher:queue
npm run dispatcher -- dispatch --dry-run
```

Only after preflight passes and the selected issue is correct:

```sh
npm run dispatcher -- dispatch
```

Inspect the last durable run record with `npm run dispatcher:status`. Runtime
files live in `.webwidgets-dispatcher/`; worktrees live in
`.worktrees/dispatcher/`. Both are ignored by Git.

## Continuous operation

After the one-shot flow is proven, use `launchd` or another scheduler to run
`npm run dispatcher -- dispatch` periodically. Do not schedule it until CLI
GitHub authentication, Claude authentication, labels, timeout behavior, and a
deliberately approved low-risk issue have all been tested manually.
