import { z } from 'zod';
import { ProviderError } from '@/lib/connectors/providerError';

// TODO: Implement Linear OAuth (https://developers.linear.app/docs/oauth/authentication).
// Required: LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET env vars, or per-user token via
// LINEAR_API_KEY for personal access tokens. Store tokens in user_tokens (has_linear column).

const LINEAR_API = 'https://api.linear.app/graphql';

function requireLinearToken(): string {
    const token = process.env.LINEAR_API_KEY;
    if (!token)
        throw new ProviderError(
            'PROVIDER_NOT_CONFIGURED',
            'Linear API key not configured. Set LINEAR_API_KEY env var.',
        );
    return token;
}

export const linearIssueSchema = z.object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    state: z.object({ name: z.string(), type: z.string() }),
    priority: z.number(),
    url: z.string(),
    updatedAt: z.string(),
    assignee: z.object({ name: z.string() }).nullable().optional(),
});

export type LinearIssue = z.infer<typeof linearIssueSchema>;

async function linearQuery<T>(query: string, schema: z.ZodType<T>): Promise<T> {
    const token = requireLinearToken();
    const res = await fetch(LINEAR_API, {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        next: { revalidate: 120 },
    });

    if (res.status === 401)
        throw new ProviderError(
            'PROVIDER_UNAUTHORIZED',
            'Linear token invalid',
        );
    if (res.status === 429)
        throw new ProviderError('PROVIDER_RATE_LIMITED', 'Linear rate limited');
    if (!res.ok)
        throw new ProviderError(
            'PROVIDER_BAD_RESPONSE',
            `Linear API ${res.status}`,
        );

    const body = (await res.json()) as { data?: unknown; errors?: unknown[] };
    if (body.errors?.length)
        throw new ProviderError(
            'PROVIDER_BAD_RESPONSE',
            'Linear GraphQL error',
        );

    const parsed = schema.safeParse(body.data);
    if (!parsed.success)
        throw new ProviderError(
            'PROVIDER_BAD_RESPONSE',
            'Linear response failed validation',
        );
    return parsed.data;
}

export async function fetchMyOpenIssues(): Promise<LinearIssue[]> {
    const schema = z.object({
        issues: z.object({ nodes: z.array(linearIssueSchema) }),
    });
    const { issues } = await linearQuery(
        `{ issues(filter: { assignee: { isMe: { eq: true } }, state: { type: { nin: ["completed", "cancelled"] } } }, first: 20) { nodes { id identifier title state { name type } priority url updatedAt assignee { name } } } }`,
        schema,
    );
    return issues.nodes;
}
