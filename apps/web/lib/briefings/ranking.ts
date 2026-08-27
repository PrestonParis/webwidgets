import type {
    BriefingSection,
    BriefingSourceEvent,
    RankedBriefingEvent,
} from './types';

export const BRIEFING_RULE_VERSION = 'briefing-rank-v1';
const urgentPattern = /\b(due|deadline|urgent|overdue|today|tomorrow)\b/i;
const reviewPattern = /\b(review|approval|failed|error|reconnect|conflict)\b/i;
const importantPattern = /\b(goal|project|task|commitment|meeting|security)\b/i;

function clamp(value: number) {
    return Math.max(0, Math.min(1, value));
}

function ageScore(occurredAt: string, windowEnd: Date) {
    const ageHours = Math.max(
        0,
        (windowEnd.getTime() - Date.parse(occurredAt)) / 3_600_000,
    );
    return clamp(1 - ageHours / 168);
}

function sectionFor(event: BriefingSourceEvent): BriefingSection {
    const text = `${event.eventType} ${event.title} ${event.summary ?? ''}`;
    if (urgentPattern.test(text)) return 'due';
    if (reviewPattern.test(text) || event.state !== 'active') return 'review';
    if (importantPattern.test(text)) return 'matters';
    return 'changed';
}

function relatedKey(event: BriefingSourceEvent) {
    const story = event.metadata['relatedStoryKey'];
    if (typeof story === 'string' && story) return `story:${story}`;
    if (event.sourceRecordTable && event.sourceRecordId)
        return `${event.sourceRecordTable}:${event.sourceRecordId}`;
    return `content:${event.contentHash}`;
}

function scoreEvent(
    event: BriefingSourceEvent,
    seenFingerprints: Set<string>,
    windowEnd: Date,
): RankedBriefingEvent {
    const text = `${event.eventType} ${event.title} ${event.summary ?? ''}`;
    const recency = ageScore(event.occurredAt, windowEnd);
    const urgency = urgentPattern.test(text) ? 1 : recency * 0.35;
    const importance = importantPattern.test(text) ? 0.9 : 0.45;
    const novelty = seenFingerprints.has(event.contentHash) ? 0.1 : 1;
    const relevance = clamp(
        0.35 + recency * 0.35 + urgency * 0.15 + importance * 0.15,
    );
    return {
        ...event,
        section: sectionFor(event),
        relevance,
        novelty,
        urgency,
        importance,
        score: clamp(
            relevance * 0.35 +
                novelty * 0.25 +
                urgency * 0.2 +
                importance * 0.2,
        ),
    };
}

export function rankBriefingEvents(
    events: BriefingSourceEvent[],
    seenFingerprints: Set<string>,
    coveredTo: string,
    limit = 20,
) {
    const ranked = events
        .map((event) =>
            scoreEvent(event, seenFingerprints, new Date(coveredTo)),
        )
        .sort((left, right) => right.score - left.score);
    const deduped = new Map<string, RankedBriefingEvent>();
    for (const event of ranked) {
        const key = relatedKey(event);
        const previous = deduped.get(key);
        if (!previous || event.score > previous.score) deduped.set(key, event);
    }
    return [...deduped.values()]
        .filter(
            (event) =>
                event.novelty > 0.1 ||
                event.section === 'due' ||
                event.state !== 'active',
        )
        .slice(0, limit);
}
