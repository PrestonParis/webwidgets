import { z } from 'zod';

const accountSchema = z.object({
    id: z.string().uuid(),
    provider: z.enum(['google', 'microsoft']),
    integration_connection_id: z.string().uuid().nullable(),
});
const connectionSchema = z.object({
    id: z.string().uuid(),
    provider_id: z.enum(['google', 'microsoft']),
    state: z.string(),
    scopes: z.array(z.string()),
});

function normalizedScopes(provider: 'google' | 'microsoft', scopes: string[]) {
    const lower = new Set(scopes.map((scope) => scope.toLowerCase()));
    const grants: Array<{
        integration: 'google_calendar' | 'google_mail' | 'microsoft_mail';
        scopes: string[];
    }> = [];
    if (
        provider === 'google' &&
        [...lower].some((scope) =>
            /calendar(\.events|:write)?$|calendar\.googleapis\.com/u.test(
                scope,
            ),
        )
    ) {
        grants.push({
            integration: 'google_calendar',
            scopes: ['calendar:write'],
        });
    }
    if (
        provider === 'google' &&
        [...lower].some((scope) =>
            /gmail\.(modify|compose)$|mail\.google\.com/u.test(scope),
        )
    ) {
        grants.push({ integration: 'google_mail', scopes: ['email:write'] });
    }
    if (provider === 'microsoft' && lower.has('mail.readwrite')) {
        grants.push({ integration: 'microsoft_mail', scopes: ['email:write'] });
    }
    return grants;
}

export function buildConnectionGrants(
    accountInput: unknown,
    connectionInput: unknown,
) {
    const accounts = z.array(accountSchema).parse(accountInput);
    const connections = z.array(connectionSchema).parse(connectionInput);
    const byId = new Map(
        connections.map((connection) => [connection.id, connection]),
    );
    return accounts.flatMap((account) => {
        const connection = account.integration_connection_id
            ? byId.get(account.integration_connection_id)
            : undefined;
        if (
            !connection ||
            connection.state !== 'connected' ||
            connection.provider_id !== account.provider
        ) {
            return [];
        }
        return normalizedScopes(account.provider, connection.scopes).map(
            (grant) => ({
                ...grant,
                provider: account.provider,
                accountId: account.id,
            }),
        );
    });
}
