import {
    fetchOpenPullRequests,
    fetchOpenIssues,
} from '@/lib/connectors/github/githubConnector';
import { fetchMyOpenIssues } from '@/lib/connectors/linear/linearConnector';
import { getServerIntegrationKey } from '@/lib/integrations/serverIntegrationKeys';
import { isNotConfigured } from '@/lib/connectors/providerError';
import type {
    DeveloperSnapshot,
    DeveloperPR,
    DeveloperIssue,
    DeveloperLinearIssue,
} from '@/features/developer/schemas/developerSchemas';

function repoFromUrl(url: string): string {
    const match = /github\.com\/([^/]+\/[^/]+)/.exec(url);
    return match?.[1] ?? url;
}

async function getGithubActivity(userId?: string): Promise<{
    prs: DeveloperPR[];
    issues: DeveloperIssue[];
    connected: boolean;
}> {
    try {
        const token = await getServerIntegrationKey(userId, 'github');
        const [rawPRs, rawIssues] = await Promise.all([
            fetchOpenPullRequests(undefined, token),
            fetchOpenIssues(undefined, token),
        ]);

        const prs: DeveloperPR[] = rawPRs.map((pr) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state,
            draft: pr.draft,
            url: pr.html_url,
            repo: repoFromUrl(pr.repository_url),
            author: pr.user?.login,
            updatedAt: pr.updated_at,
        }));

        const issues: DeveloperIssue[] = rawIssues.map((issue) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            url: issue.html_url,
            repo: repoFromUrl(issue.html_url),
            labels: issue.labels.map((l) => l.name),
            updatedAt: issue.updated_at,
        }));

        return { prs, issues, connected: true };
    } catch (err) {
        if (isNotConfigured(err))
            return { prs: [], issues: [], connected: false };
        throw err;
    }
}

async function getLinearActivity(userId?: string): Promise<{
    issues: DeveloperLinearIssue[];
    connected: boolean;
}> {
    try {
        const token = await getServerIntegrationKey(userId, 'linear');
        const rawIssues = await fetchMyOpenIssues(token);
        return {
            connected: true,
            issues: rawIssues.map((issue) => ({
                id: issue.id,
                identifier: issue.identifier,
                title: issue.title,
                state: issue.state.name,
                priority: issue.priority,
                url: issue.url,
                ...(issue.assignee?.name
                    ? { assignee: issue.assignee.name }
                    : {}),
                updatedAt: issue.updatedAt,
            })),
        };
    } catch (err) {
        if (isNotConfigured(err)) return { issues: [], connected: false };
        throw err;
    }
}

export async function getDeveloperSnapshot(
    userId?: string,
): Promise<DeveloperSnapshot> {
    const [github, linear] = await Promise.all([
        getGithubActivity(userId),
        getLinearActivity(userId),
    ]);
    const connectedProviders = [
        ...(github.connected ? ['github'] : []),
        ...(linear.connected ? ['linear'] : []),
    ];

    return {
        pullRequests: github.prs,
        issues: github.issues,
        linearIssues: linear.issues,
        connectedProviders,
    };
}
