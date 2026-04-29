import { classifyWithClaude } from './claude';
import { classifyWithMlService } from './mlService';
import { classifyWithRules } from './rules';

export async function classifyEmails(emails) {
    try {
        return await classifyWithClaude(emails);
    } catch {}

    try {
        return await classifyWithMlService(emails);
    } catch {}

    return classifyWithRules(emails);
}
