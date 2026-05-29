import { describe, expect, it } from 'vitest';
import { verifyN8nWebhook } from '@/lib/n8n/verifyN8nWebhook';

describe('verifyN8nWebhook', () => {
    it('rejects invalid secrets', () => {
        expect(() =>
            verifyN8nWebhook(new Headers(), 'expected-secret-value'),
        ).toThrow('Invalid n8n webhook secret.');
    });

    it('accepts a valid secret header', () => {
        const headers = new Headers({
            'x-n8n-webhook-secret': 'expected-secret-value',
        });
        expect(() =>
            verifyN8nWebhook(headers, 'expected-secret-value'),
        ).not.toThrow();
    });
});
