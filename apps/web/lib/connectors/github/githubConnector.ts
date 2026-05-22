import { z } from 'zod';
import { ProviderError } from '@/lib/connectors/providerError';
import { getProviderEnvKey } from '@/lib/integrations/serverIntegrationKeys';

const GITHUB_API = 'https://api.github.com';

// Uses a server-side PAT (GITHUB_TOKEN env var). Per-user OAuth can be layered
// in later without changing the fetch/validation boundary below.
function requireToken(tokenOverride?: string | null): string {
    const token = tokenOverride?.trim() || getProviderEnvKey('github');
    if (!token)
        throw new ProviderError(
            'PROVIDER_NOT_CONFIGURED',
            'GitHub token not configured. Add a GitHub integration key or set GITHUB_TOKEN.',
        );
    return token;
}

async function githubFetch<T>(
    path: string,
    schema: z.ZodType<T>,
    tokenOverride?: string | null,
): Promise<T> {
    const token = requireToken(tokenOverride);
    const res = await fetch(`${GITHUB_API}${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401)
        throw new ProviderError(
            'PROVIDER_UNAUTHORIZED',
            'GitHub token invalid or expired',
        );
    if (res.status === 403)
        throw new ProviderError(
            'PROVIDER_UNAUTHORIZED',
            'GitHub token lacks required scopes',
        );
    if (res.status === 429)
        throw new ProviderError(
            'PROVIDER_RATE_LIMITED',
            'GitHub API rate limit reached',
        );
    if (!res.ok)
        throw new ProviderError(
            'PROVIDER_BAD_RESPONSE',
            `GitHub API ${res.status}`,
        );

    const parsed = schema.safeParse(await res.json());
    if (!parsed.success)
        throw new ProviderError(
            'PROVIDER_BAD_RESPONSE',
            'GitHub response failed validation',
        );
    return parsed.data;
}

export const githubPRSchema = z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.enum(['open', 'closed']),
    draft: z.boolean(),
    html_url: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    repository_url: z.string(),
    user: z.object({ login: z.string() }).nullable(),
});

export const githubIssueSchema = z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.enum(['open', 'closed']),
    html_url: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    pull_request: z.unknown().optional(),
    labels: z.array(z.object({ name: z.string() })),
});

export type GithubPR = z.infer<typeof githubPRSchema>;
export type GithubIssue = z.infer<typeof githubIssueSchema>;

export async function fetchOpenPullRequests(
    org?: string,
    token?: string | null,
): Promise<GithubPR[]> {
    const path = org
        ? `/search/issues?q=org:${org}+type:pr+state:open&per_page=20&sort=updated`
        : `/search/issues?q=involves:@me+type:pr+state:open&per_page=20&sort=updated`;

    const schema = z.object({ items: z.array(githubPRSchema) });
    const { items } = await githubFetch(path, schema, token);
    return items;
}

export async function fetchOpenIssues(
    org?: string,
    token?: string | null,
): Promise<GithubIssue[]> {
    const path = org
        ? `/search/issues?q=org:${org}+type:issue+state:open&per_page=20&sort=updated`
        : `/search/issues?q=involves:@me+type:issue+state:open&per_page=20&sort=updated`;

    const schema = z.object({ items: z.array(githubIssueSchema) });
    const { items } = await githubFetch(path, schema, token);
    return items.filter((i) => !i.pull_request);
}
