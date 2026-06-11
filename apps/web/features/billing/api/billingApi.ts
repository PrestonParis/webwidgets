import { apiRouteFetch } from '@/lib/api/client';
export async function createCheckoutSession(
    planId: 'pro' | 'business',
): Promise<string> {
    const res = await apiRouteFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
    });
    if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to create checkout session');
    }
    const data = (await res.json()) as { url: string };
    return data.url;
}

export async function createPortalSession(): Promise<string> {
    const res = await apiRouteFetch('/api/billing/portal', { method: 'POST' });
    if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to open billing portal');
    }
    const data = (await res.json()) as { url: string };
    return data.url;
}
