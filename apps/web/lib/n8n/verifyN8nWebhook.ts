import { timingSafeEqual } from 'node:crypto';
import { N8nError } from '@/lib/n8n/n8nErrors';

const SECRET_HEADERS = [
    'x-n8n-webhook-secret',
    'x-webhook-secret',
    'x-webwidgets-n8n-secret',
];

function secretsMatch(expected: string, provided: string | null | undefined) {
    const expectedBytes = Buffer.from(expected);
    const providedBytes = Buffer.from(provided ?? '');
    return (
        expectedBytes.length === providedBytes.length &&
        timingSafeEqual(expectedBytes, providedBytes)
    );
}

export function verifyN8nWebhook(
    headers: Headers,
    secret = process.env.N8N_WEBHOOK_SECRET,
): void {
    if (!secret) {
        throw new N8nError(
            'N8N_WEBHOOK_INVALID',
            'n8n webhook secret is not configured.',
        );
    }

    const provided = SECRET_HEADERS.map((header) => headers.get(header)).find(
        Boolean,
    );
    if (!secretsMatch(secret, provided)) {
        throw new N8nError(
            'N8N_UNAUTHORIZED',
            'Invalid n8n webhook secret.',
            401,
        );
    }

    const expectedAgent = process.env.N8N_WEBHOOK_USER_AGENT;
    if (expectedAgent) {
        const agent = headers.get('user-agent');
        if (agent !== expectedAgent) {
            throw new N8nError(
                'N8N_UNAUTHORIZED',
                'Invalid n8n webhook user agent.',
                401,
            );
        }
    }
}
