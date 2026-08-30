import { apiRouteFetch } from '@/lib/api/client';

function expectOk(response: Response) {
    if (!response.ok) throw new Error(`integration_keys_${response.status}`);
}

export async function listIntegrationKeyProviders() {
    const response = await apiRouteFetch('/api/integration-keys');
    expectOk(response);
    const result = (await response.json()) as { providers: string[] };
    return result.providers;
}

export async function saveIntegrationKey(provider: string, apiKey: string) {
    const response = await apiRouteFetch('/api/integration-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
    });
    expectOk(response);
}

export async function deleteIntegrationKey(provider: string) {
    const response = await apiRouteFetch(
        `/api/integration-keys/${encodeURIComponent(provider)}`,
        { method: 'DELETE' },
    );
    expectOk(response);
}

export async function getEmailIntelligenceKeyStatus() {
    const response = await apiRouteFetch(
        '/api/settings/email-intelligence-key',
    );
    expectOk(response);
    return response.json() as Promise<{ hasKey: boolean }>;
}

export async function saveEmailIntelligenceKey(apiKey: string) {
    const response = await apiRouteFetch(
        '/api/settings/email-intelligence-key',
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey }),
        },
    );
    expectOk(response);
}

export async function deleteEmailIntelligenceKey() {
    const response = await apiRouteFetch(
        '/api/settings/email-intelligence-key',
        {
            method: 'DELETE',
        },
    );
    expectOk(response);
}
