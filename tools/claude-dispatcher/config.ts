import path from 'node:path';

import type { DispatcherConfig } from './types';

function parseArgs(value: string | undefined): string[] {
    if (!value) return ['-p'];
    const parsed: unknown = JSON.parse(value);
    if (
        !Array.isArray(parsed) ||
        !parsed.every((item) => typeof item === 'string')
    ) {
        throw new Error(
            'WW_DISPATCH_CLAUDE_ARGS_JSON must be a JSON string array',
        );
    }
    return parsed;
}

function parseTimeout(value: string | undefined): number {
    if (!value) return 45 * 60 * 1000;
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds < 60) {
        throw new Error('WW_DISPATCH_TIMEOUT_SECONDS must be at least 60');
    }
    return seconds * 1000;
}

export function loadConfig(
    repoRoot = process.cwd(),
    env: Readonly<Record<string, string | undefined>> = process.env,
): DispatcherConfig {
    const stateDir =
        env.WW_DISPATCH_STATE_DIR ??
        path.join(repoRoot, '.webwidgets-dispatcher');
    return {
        repoRoot,
        repository: env.WW_DISPATCH_REPOSITORY ?? 'PrestonParis/aidash',
        approvalLabel: env.WW_DISPATCH_APPROVAL_LABEL ?? 'state:approved',
        claimedLabel: env.WW_DISPATCH_CLAIMED_LABEL ?? 'state:claimed',
        blockedLabels: (
            env.WW_DISPATCH_BLOCKED_LABELS ?? 'state:blocked,decision:required'
        )
            .split(',')
            .map((label) => label.trim())
            .filter(Boolean),
        baseBranch: env.WW_DISPATCH_BASE_BRANCH ?? 'origin/main',
        claudeBin: env.WW_DISPATCH_CLAUDE_BIN ?? 'claude',
        claudeArgs: parseArgs(env.WW_DISPATCH_CLAUDE_ARGS_JSON),
        timeoutMs: parseTimeout(env.WW_DISPATCH_TIMEOUT_SECONDS),
        stateDir,
        worktreeRoot:
            env.WW_DISPATCH_WORKTREE_ROOT ??
            path.join(repoRoot, '.worktrees', 'dispatcher'),
    };
}
