import { runCommand } from './command';
import type { DispatchIssue, DispatcherConfig } from './types';

function gh(config: DispatcherConfig, args: string[]) {
    return runCommand('gh', args, { cwd: config.repoRoot });
}

export async function listOpenIssues(
    config: DispatcherConfig,
): Promise<DispatchIssue[]> {
    const result = await gh(config, [
        'issue',
        'list',
        '--repo',
        config.repository,
        '--state',
        'open',
        '--limit',
        '100',
        '--json',
        'number,title,body,url,createdAt,labels,assignees',
    ]);
    if (result.exitCode !== 0)
        throw new Error(result.stderr.trim() || 'gh issue list failed');
    return JSON.parse(result.stdout) as DispatchIssue[];
}

export async function fetchIssue(
    config: DispatcherConfig,
    issueNumber: number,
): Promise<DispatchIssue> {
    const result = await gh(config, [
        'issue',
        'view',
        String(issueNumber),
        '--repo',
        config.repository,
        '--json',
        'number,title,body,url,createdAt,labels,assignees',
    ]);
    if (result.exitCode !== 0)
        throw new Error(result.stderr.trim() || 'gh issue view failed');
    return JSON.parse(result.stdout) as DispatchIssue;
}

export async function claimIssue(
    config: DispatcherConfig,
    issueNumber: number,
    runId: string,
): Promise<void> {
    const edit = await gh(config, [
        'issue',
        'edit',
        String(issueNumber),
        '--repo',
        config.repository,
        '--remove-label',
        config.approvalLabel,
        '--add-label',
        config.claimedLabel,
    ]);
    if (edit.exitCode !== 0)
        throw new Error(edit.stderr.trim() || 'failed to claim issue');
    await commentIssue(
        config,
        issueNumber,
        `Dispatcher claimed this issue for Claude run \`${runId}\`.`,
    );
}

export async function commentIssue(
    config: DispatcherConfig,
    issueNumber: number,
    body: string,
): Promise<void> {
    const result = await gh(config, [
        'issue',
        'comment',
        String(issueNumber),
        '--repo',
        config.repository,
        '--body',
        body,
    ]);
    if (result.exitCode !== 0)
        throw new Error(result.stderr.trim() || 'failed to comment');
}

export async function releaseIssue(
    config: DispatcherConfig,
    issueNumber: number,
): Promise<void> {
    const result = await gh(config, [
        'issue',
        'edit',
        String(issueNumber),
        '--repo',
        config.repository,
        '--remove-label',
        config.claimedLabel,
        '--add-label',
        config.approvalLabel,
    ]);
    if (result.exitCode !== 0)
        throw new Error(result.stderr.trim() || 'failed to release issue');
}
