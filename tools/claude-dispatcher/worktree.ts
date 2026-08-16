import path from 'node:path';

import { runCommand } from './command';
import type { DispatchIssue, DispatcherConfig } from './types';

function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 42);
}

export function issueBranch(issue: DispatchIssue): string {
    return `agent/claude/${issue.number}-${slugify(issue.title)}`;
}

export async function createWorktree(
    config: DispatcherConfig,
    issue: DispatchIssue,
): Promise<{ branch: string; worktree: string }> {
    const branch = issueBranch(issue);
    const worktree = path.join(config.worktreeRoot, `issue-${issue.number}`);
    const result = await runCommand(
        'git',
        ['worktree', 'add', '-b', branch, worktree, config.baseBranch],
        { cwd: config.repoRoot },
    );
    if (result.exitCode !== 0)
        throw new Error(result.stderr.trim() || 'git worktree add failed');
    return { branch, worktree };
}
