import {
    EMAIL_CATEGORIES,
    EmailCategory,
    EmailInput,
} from '@/features/inbox/types/inbox';
import { z } from 'zod';
import { getLogger } from '@/lib/observability/logger';
import {
    externalApiDuration,
    externalApiErrors,
} from '@/lib/observability/metrics';

const predictionSchema = z.object({
    id: z.string(),
    category: z.string(),
});

const predictionsSchema = z.array(predictionSchema);

export async function classifyWithMlService(
    emails: EmailInput[],
): Promise<Map<number, EmailCategory>> {
    const log = getLogger({ operation: 'classifyWithMlService' });
    const mlUrl = process.env.ML_SERVICE_URL;
    if (!mlUrl) throw new Error('No ML_SERVICE_URL');

    const endTimer = externalApiDuration.startTimer({
        service: 'ml',
        operation: 'classify_batch',
    });
    try {
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

        if (!res.ok) {
            endTimer({ status: String(res.status) });
            externalApiErrors.inc({
                service: 'ml',
                operation: 'classify_batch',
            });
            throw new Error(`ML service ${res.status}`);
        }

        const json: unknown = await res.json();
        const parsed = predictionsSchema.safeParse(json);
        if (!parsed.success) {
            endTimer({ status: 'parse_error' });
            externalApiErrors.inc({
                service: 'ml',
                operation: 'classify_batch',
            });
            throw new Error('Invalid ML response');
        }

        endTimer({ status: '200' });
        log.debug({ emailCount: emails.length }, 'ML classification succeeded');

        const out = new Map<number, EmailCategory>();
        for (const p of parsed.data) {
            const cat = EMAIL_CATEGORIES.includes(p.category as EmailCategory)
                ? (p.category as EmailCategory)
                : 'other';
            out.set(Number(p.id), cat);
        }
        return out;
    } catch (err) {
        endTimer({ status: 'error' });
        externalApiErrors.inc({ service: 'ml', operation: 'classify_batch' });
        log.error({ err }, 'ML service request failed');
        throw err;
    }
}
