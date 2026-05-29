import { EmailCategory, EmailInput } from '@/features/inbox/types/inbox';
import { RULES } from '../constants';

export function classifyWithRules(
    emails: EmailInput[],
): Map<number, EmailCategory> {
    const out = new Map<number, EmailCategory>();
    for (const e of emails) {
        const text = `${e.sender} ${e.subject}`;
        const match = RULES.find((r) => r.pattern.test(text));
        out.set(e.idx, match?.category ?? 'other');
    }
    return out;
}
