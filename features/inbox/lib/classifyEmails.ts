import type { EmailInput, EmailCategory } from '@/features/inbox/types/inbox';
import { routeInference } from './modelRouter';

export interface ClassifyOptions {
    useAI: boolean;
    apiKey?: string;
}

export async function classifyEmails(
    emails: EmailInput[],
    { useAI, apiKey }: ClassifyOptions = { useAI: false },
): Promise<Map<number, EmailCategory>> {
    return routeInference(emails, {
        allowHosted: useAI,
        ...(apiKey ? { apiKey } : {}),
    });
}
