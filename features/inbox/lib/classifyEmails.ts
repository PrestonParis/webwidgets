import { classifyWithClaude } from './claude';
import { classifyWithMlService } from './mlService';
import { classifyWithRules } from './rules';
import { EmailInput } from '@/types/inbox';

export async function classifyEmails(emails: EmailInput[]) {
    try {
        return await classifyWithClaude(emails);
    } catch {}

    try {
        return await classifyWithMlService(emails);
    } catch {}

    return classifyWithRules(emails);
}
