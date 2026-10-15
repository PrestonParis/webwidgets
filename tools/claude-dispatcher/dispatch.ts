import crypto from 'node:crypto';

import { runCommand } from './command';
import {
    claimIssue,
    commentIssue,
    fetchIssue,
    listOpenIssues,
    releaseIssue,
} from './github';
import { buildClaudePrompt } from './prompt';
import { ineligibleReason, selectEligibleIssues } from './selection';
import { acquireDispatcherLock, saveRun } from './state';
import type { DispatcherConfig, DispatchRun, RunStatus } from './types';
import { createWorktree, issueBranch } from './worktree';

function updateRun(
    config: DispatcherConfig,
    run: DispatchRun,
    status: RunStatus,
): void {
    run.status = status;
    run.updatedAt = new Date().toISOString();
    saveRun(config, run);
}

export async function dispatchOnce(
    config: DispatcherConfig,
    dryRun: boolean,
): Promise<void> {
    const releaseLock = acquireDispatcherLock(config);
    try {
        const eligible = selectEligibleIssues(
            await listOpenIssues(config),
            config,
        );
        const issue = eligible[0];
        if (!issue)
            throw new Error('No approved, eligible issues are available');
        if (dryRun) {
            process.stdout.write(
                `#${issue.number} ${issue.title}\n${issue.url}\n`,
            );
            return;
        }

        const freshIssue = await fetchIssue(config, issue.number);
        const reason = ineligibleReason(freshIssue, config);
        if (reason)
            throw new Error(
                `Issue #${issue.number} became ineligible: ${reason}`,
            );
        const id = `${issue.number}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const run: DispatchRun = {
            id,
            issueNumber: issue.number,
            issueTitle: issue.title,
            issueUrl: issue.url,
            branch: issueBranch(issue),
            worktree: '',
            status: 'claimed',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        saveRun(config, run);
        await claimIssue(config, issue.number, id);
        await executeClaimedRun(config, freshIssue, run);
    } finally {
        releaseLock();
    }
}

async function executeClaimedRun(
    config: DispatcherConfig,
    issue: Awaited<ReturnType<typeof fetchIssue>>,
    run: DispatchRun,
): Promise<void> {
    try {
        updateRun(config, run, 'preparing');
        const prepared = await createWorktree(config, issue);
        run.branch = prepared.branch;
        run.worktree = prepared.worktree;
        updateRun(config, run, 'running');
        const result = await runCommand(
            config.claudeBin,
            [...config.claudeArgs, buildClaudePrompt(issue)],
            { cwd: run.worktree, timeoutMs: config.timeoutMs, stream: true },
        );
        run.exitCode = result.exitCode;
        if (result.exitCode !== 0)
            throw new Error(`Claude exited with code ${result.exitCode}`);
        updateRun(config, run, 'completed');
        await commentIssue(
            config,
            issue.number,
            `Claude dispatcher run \`${run.id}\` completed. Branch: \`${run.branch}\`. Independent review is still required.`,
        );
    } catch (error) {
        run.error = error instanceof Error ? error.message : String(error);
        updateRun(config, run, 'failed');
        await releaseIssue(config, issue.number).catch(() => undefined);
        await commentIssue(
            config,
            issue.number,
            `Claude dispatcher run \`${run.id}\` failed: ${run.error}`,
        ).catch(() => undefined);
        throw error;
    }
}
