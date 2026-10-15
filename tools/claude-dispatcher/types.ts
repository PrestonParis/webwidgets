export type RunStatus =
    | 'claimed'
    | 'preparing'
    | 'running'
    | 'completed'
    | 'failed'
    | 'interrupted';

export interface IssueLabel {
    name: string;
}

export interface IssueAssignee {
    login: string;
}

export interface DispatchIssue {
    number: number;
    title: string;
    body: string;
    url: string;
    createdAt: string;
    labels: IssueLabel[];
    assignees: IssueAssignee[];
}

export interface DispatcherConfig {
    repoRoot: string;
    repository: string;
    approvalLabel: string;
    claimedLabel: string;
    blockedLabels: string[];
    baseBranch: string;
    claudeBin: string;
    claudeArgs: string[];
    timeoutMs: number;
    stateDir: string;
    worktreeRoot: string;
}

export interface DispatchRun {
    id: string;
    issueNumber: number;
    issueTitle: string;
    issueUrl: string;
    branch: string;
    worktree: string;
    status: RunStatus;
    startedAt: string;
    updatedAt: string;
    exitCode?: number;
    error?: string;
}

export interface CommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}
