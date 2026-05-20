import {
    fetchOpenPullRequests,
    fetchOpenIssues,
} from '@/lib/connectors/github/githubConnector';
import { isNotConfigured } from '@/lib/connectors/providerError';
import type {
    DeveloperSnapshot,
    DeveloperPR,
    DeveloperIssue,
} from '@/features/developer/schemas/developerSchemas';

function repoFromUrl(url: string): string {
    const match = /github\.com\/([^/]+\/[^/]+)/.exec(url);
    return match?.[1] ?? url;
}

async function getGithubActivity(): Promise<{
    prs: DeveloperPR[];
    issues: DeveloperIssue[];
    connected: boolean;
}> {
    try {
        const [rawPRs, rawIssues] = await Promise.all([
            fetchOpenPullRequests(),
            fetchOpenIssues(),
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

export async function getDeveloperSnapshot(): Promise<DeveloperSnapshot> {
    const github = await getGithubActivity();
    const connectedProviders = github.connected ? ['github'] : [];

    return {
        pullRequests: github.prs,
        issues: github.issues,
        connectedProviders,
    };
}
