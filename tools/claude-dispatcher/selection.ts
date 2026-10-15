import type { DispatchIssue, DispatcherConfig } from './types';

function labelNames(issue: DispatchIssue): Set<string> {
    return new Set(issue.labels.map((label) => label.name));
}

export function issuePriority(issue: DispatchIssue): number {
    const match = issue.body.match(/Priority:\s*P([0-3])/i);
    return match ? Number(match[1]) : 4;
}

export function ineligibleReason(
    issue: DispatchIssue,
    config: DispatcherConfig,
): string | undefined {
    const labels = labelNames(issue);
    const bodyApproved = /State:\s*approved\b/i.test(issue.body);
    if (!labels.has(config.approvalLabel) && !bodyApproved)
        return 'not approved';
    if (labels.has(config.claimedLabel)) return 'already claimed';
    const blocker = config.blockedLabels.find((label) => labels.has(label));
    if (blocker) return `blocked by ${blocker}`;
    if (issue.assignees.length > 0) return 'already assigned';
    if (/State:\s*blocked\b/i.test(issue.body)) return 'body state is blocked';
    return undefined;
}

export function selectEligibleIssues(
    issues: DispatchIssue[],
    config: DispatcherConfig,
): DispatchIssue[] {
    return issues
        .filter((issue) => !ineligibleReason(issue, config))
        .sort(
            (left, right) =>
                issuePriority(left) - issuePriority(right) ||
                left.createdAt.localeCompare(right.createdAt) ||
                left.number - right.number,
        );
}
