#!/bin/zsh

set -euo pipefail

readonly REPOSITORY="${WW_CLAUDE_LINT_REPOSITORY:-PrestonParis/aidash}"
readonly REPO_ROOT="${WW_CLAUDE_LINT_REPO_ROOT:-$(pwd)}"
readonly CLAUDE_BIN="${WW_CLAUDE_LINT_CLAUDE_BIN:-/Users/nna/.local/bin/claude}"
readonly STATE_DIR="${WW_CLAUDE_LINT_STATE_DIR:-/Users/nna/Library/Application Support/WebWidgets/claude-lint-failsafe}"
readonly WORKTREE_ROOT="$STATE_DIR/worktrees"
readonly ARTIFACT_ROOT="$STATE_DIR/artifacts"
readonly LOCK_DIR="$STATE_DIR/active.lock"

log() {
    print -r -- "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*"
}

acquire_lock() {
    mkdir -p "$STATE_DIR"
    if ! mkdir "$LOCK_DIR" 2>/dev/null; then
        log "Another Claude lint failsafe is already active"
        exit 0
    fi
    trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT INT TERM
}

remote_branch_exists() {
    git -C "$REPO_ROOT" ls-remote --exit-code --heads origin "refs/heads/$1" >/dev/null 2>&1
}

pull_request_url() {
    gh pr list \
        --repo "$REPOSITORY" \
        --state all \
        --head "$1" \
        --limit 1 \
        --json url \
        --jq '.[0].url // ""'
}

latest_run() {
    gh run list \
        --repo "$REPOSITORY" \
        --workflow daily-lint-report.yml \
        --branch main \
        --status completed \
        --limit 1 \
        --json databaseId,headSha,conclusion,createdAt
}

validate_artifacts() {
    local artifact_dir="$1"
    local report
    for report in lint ts smells; do
        jq -e '.status and .generatedAt and (.results | type == "array")' \
            "$artifact_dir/reports/$report/latest.json" >/dev/null
    done
    jq -e '.status and .generatedAt and .fileCount and .largestFiles' \
        "$artifact_dir/reports/stats/latest.json" >/dev/null
}

prepare_artifacts() {
    local run_id="$1"
    local artifact_dir="$ARTIFACT_ROOT/$run_id"
    if [[ ! -d "$artifact_dir/reports" ]]; then
        mkdir -p "$artifact_dir"
        gh run download "$run_id" \
            --repo "$REPOSITORY" \
            --name "lint-reports-$run_id" \
            --dir "$artifact_dir"
    fi
    validate_artifacts "$artifact_dir"
    print -r -- "$artifact_dir"
}

prepare_worktree() {
    local run_id="$1"
    local head_sha="$2"
    local branch="$3"
    local worktree="$WORKTREE_ROOT/run-$run_id"
    mkdir -p "$WORKTREE_ROOT"
    if [[ -d "$worktree/.git" || -f "$worktree/.git" ]]; then
        print -r -- "$worktree"
        return
    fi
    git -C "$REPO_ROOT" fetch --quiet origin main
    if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$branch"; then
        git -C "$REPO_ROOT" worktree add "$worktree" "$branch"
    elif remote_branch_exists "$branch"; then
        git -C "$REPO_ROOT" fetch --quiet origin "$branch:$branch"
        git -C "$REPO_ROOT" worktree add "$worktree" "$branch"
    else
        git -C "$REPO_ROOT" worktree add -b "$branch" "$worktree" "$head_sha"
        git -C "$worktree" push --quiet -u origin "$branch"
    fi
    print -r -- "$worktree"
}

run_claude() {
    local run_id="$1"
    local head_sha="$2"
    local branch="$3"
    local worktree="$4"
    local artifact_dir="$5"
    local prompt
    prompt="Remediate findings from completed WebWidgets Daily lint report run $run_id at commit $head_sha.

The validated report artifact is at $artifact_dir/reports. Read lint/latest.json, ts/latest.json, smells/latest.json, and stats/latest.json before selecting work.

Read AGENTS.md, ARCHITECTURE.md, ROADMAP.md, and DEFINITION_OF_DONE.md first. Work only in this prepared worktree on branch $branch. Inspect open pull requests before selecting a subsystem. Choose one coherent, high-impact, non-ambiguous root-cause cluster in one subsystem, limited to at most 20 reported findings. Avoid high-fan-in files and documented architectural ambiguities unless the fix is narrowly additive and established by an existing pattern. Implement complete fixes with no suppressions, placeholders, weakened tests, or unrelated refactors. Do not run npm run build. Run scoped lint, TypeScript, and relevant tests and confirm the chosen findings are resolved. Commit, push, and open a draft pull request to main. Include source workflow run $run_id and validation evidence in the PR body. Never merge or deploy. If safe completion is not possible in one focused PR, do not leave a partial implementation; report the blocker in your final output."

    "$CLAUDE_BIN" -p \
        --effort high \
        --permission-mode acceptEdits \
        --permission-prompts none \
        --allowedTools "Read,Edit,Write,Grep,Glob,Bash(git status *),Bash(git diff *),Bash(git log *),Bash(git add *),Bash(git commit *),Bash(git push *),Bash(gh pr list *),Bash(gh pr create *),Bash(npm run check *),Bash(npm run linting:*),Bash(npm run test *),Bash(npm test *),Bash(jq *)" \
        --add-dir "$artifact_dir" \
        "$prompt"
}

main() {
    acquire_lock
    cd "$REPO_ROOT"
    local run_json
    if ! run_json="$(latest_run 2>/dev/null)"; then
        log "Daily lint workflow is not available on main yet"
        return
    fi
    local run_id
    run_id="$(jq -r '.[0].databaseId // empty' <<<"$run_json")"
    local head_sha
    head_sha="$(jq -r '.[0].headSha // empty' <<<"$run_json")"
    if [[ -z "$run_id" || -z "$head_sha" ]]; then
        log "No completed daily lint run is available"
        return
    fi

    local codex_branch="codex/lint-remediation-run-$run_id"
    local claude_branch="agent/claude/lint-remediation-run-$run_id"
    local existing_pr
    existing_pr="$(pull_request_url "$codex_branch")"
    [[ -z "$existing_pr" ]] || { log "Codex remediation already exists: $existing_pr"; return; }
    if remote_branch_exists "$codex_branch"; then
        log "Codex has claimed lint run $run_id"
        return
    fi
    existing_pr="$(pull_request_url "$claude_branch")"
    [[ -z "$existing_pr" ]] || { log "Claude remediation already exists: $existing_pr"; return; }

    local artifact_dir
    artifact_dir="$(prepare_artifacts "$run_id")"
    if [[ "${WW_CLAUDE_LINT_DRY_RUN:-0}" == "1" ]]; then
        log "Dry run ready for lint run $run_id using $artifact_dir"
        return
    fi
    local worktree
    worktree="$(prepare_worktree "$run_id" "$head_sha" "$claude_branch")"
    log "Claude is remediating lint run $run_id in $worktree"
    run_claude "$run_id" "$head_sha" "$claude_branch" "$worktree" "$artifact_dir"
    existing_pr="$(pull_request_url "$claude_branch")"
    if [[ -z "$existing_pr" ]]; then
        log "Claude finished without opening a pull request; worktree retained at $worktree"
        return 1
    fi
    log "Claude remediation created: $existing_pr"
}

main "$@"
