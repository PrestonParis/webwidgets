import type { Email, EmailAction } from '../types/inbox';

const CATEGORY_BASE: Record<string, number> = {
    work: 30,
    finance: 25,
    personal: 20,
    social: 10,
    shopping: 5,
    notifications: 5,
    promotions: 2,
    other: 5,
};

const ALERT_PATTERN =
    /security|alert|urgent|verify|password|breach|suspicious|fraud|warning|compromised/i;

/**
 * Returns a numeric priority score for an email.
 * Higher = more important. Used for "Priority" sort in the inbox feed.
 */
export function computePriorityScore(
    email: Pick<Email, 'category' | 'subject'>,
    emailActions: Pick<EmailAction, 'type' | 'due_date' | 'completed'>[],
): number {
    let score = CATEGORY_BASE[email.category ?? 'other'] ?? 5;

    for (const a of emailActions) {
        if (a.completed) continue;
        if ((a.type === 'deadline' || a.type === 'event') && a.due_date) {
            const days =
                (new Date(a.due_date).getTime() - Date.now()) / 86_400_000;
            const urgency =
                days < 0
                    ? 60
                    : days < 1
                      ? 50
                      : days < 2
                        ? 40
                        : days < 4
                          ? 25
                          : days < 7
                            ? 15
                            : 5;
            // Events are slightly less urgent than deadlines
            score +=
                a.type === 'deadline' ? urgency : Math.round(urgency * 0.7);
        } else if (a.type === 'action') {
            score += 8;
        }
    }

    if (ALERT_PATTERN.test(email.subject)) {
        score += 25;
    }

    return score;
}
