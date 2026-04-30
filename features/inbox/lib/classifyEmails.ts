import { EmailInput, EmailCategory } from '@/types/inbox';
import { classifyWithClaude } from './claude';
import { classifyWithMlService } from './mlService';
import { classifyWithRules } from './rules';

export async function classifyEmails(
    emails: EmailInput[],
): Promise<Map<number, EmailCategory>> {
    try {
        return await classifyWithClaude(emails);
    } catch (e) {
        console.warn('Claude classification failed, trying ML service:', e);
    }
    try {
        return await classifyWithMlService(emails);
    } catch (e) {
        console.warn('ML service failed, using rule-based fallback:', e);
    }
    return classifyWithRules(emails);
}
