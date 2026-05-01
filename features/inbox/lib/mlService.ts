import {
    EMAIL_CATEGORIES,
    EmailCategory,
    EmailInput,
} from '@/features/inbox/types/inbox';

export async function classifyWithMlService(
    emails: EmailInput[],
): Promise<Map<number, EmailCategory>> {
    const mlUrl = process.env.ML_SERVICE_URL;
    if (!mlUrl) throw new Error('No ML_SERVICE_URL');

    const res = await fetch(`${mlUrl}/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emails: emails.map(({ idx, sender, subject }) => ({
                id: String(idx),
                sender,
                subject,
            })),
        }),
        signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`ML service ${res.status}`);

    const predictions: { id: string; category: string }[] = await res.json();
    const out = new Map<number, EmailCategory>();
    for (const p of predictions) {
        const cat = EMAIL_CATEGORIES.includes(p.category as EmailCategory)
            ? (p.category as EmailCategory)
            : 'other';
        out.set(Number(p.id), cat);
    }
    return out;
}
