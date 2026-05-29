import { describe, expect, it } from 'vitest';
import { validateCustomApiSource } from '@/features/widgets/synthesis/security/customWidgetSecurity';

const baseConfig = {
    name: 'Safe API',
    baseUrl: 'https://api.example.com',
    endpoint: '/items',
    method: 'GET',
    headers: {},
    queryParams: {},
    auth: { type: 'none' },
    refreshIntervalSeconds: 900,
    responseSchema: { id: 'string' },
    sampleResponse: [{ id: '1' }],
    mappingRules: [],
    rateLimit: { requests: 30, intervalSeconds: 60 },
};

describe('validateCustomApiSource', () => {
    it('accepts safe HTTPS API definitions', () => {
        expect(validateCustomApiSource(baseConfig).isOk()).toBe(true);
    });

    it('rejects unsafe internal URLs', () => {
        const result = validateCustomApiSource({
            ...baseConfig,
            baseUrl: 'http://localhost:3000',
        });
        expect(result.isErr()).toBe(true);
    });

    it('rejects raw secret headers in widget state', () => {
        const result = validateCustomApiSource({
            ...baseConfig,
            headers: { Authorization: 'Bearer abc' },
        });
        expect(result.isErr()).toBe(true);
    });
});
