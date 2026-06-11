// Lightweight rule-based recommendations derived from recent activity.
// Rules fire when specific patterns appear in the event stream.
// Recommendations are NOT stored — they are computed fresh from loaded events.

import type { ActivityEvent } from '@/features/activity/types/activity';

export interface ActivityRecommendation {
    id: string;
    title: string;
    body: string;
    actionLabel: string;
    actionUrl: string;
    priority: 'normal' | 'high';
    sourceEventId?: string;
}

export function buildRecommendations(
    events: ActivityEvent[],
): ActivityRecommendation[] {
    const recs: ActivityRecommendation[] = [];
    const now = Date.now();
    const h72 = 72 * 3_600_000;
    const recent = events.filter(
        (e) => now - new Date(e.occurredAt).getTime() < h72,
    );

    // Rule: automation failed → review automation
    const failedAutomations = recent.filter(
        (e) => e.eventType === 'automation.failed',
    );
    if (failedAutomations.length > 0) {
        recs.push({
            id: 'rec-automation-failed',
            title: `${failedAutomations.length} automation${failedAutomations.length > 1 ? 's' : ''} failed`,
            body: 'Check your automation configurations and retry.',
            actionLabel: 'Review automations',
            actionUrl: '/settings',
            priority: 'high',
            ...(failedAutomations[0]?.id && {
                sourceEventId: failedAutomations[0].id,
            }),
        });
    }

    // Rule: extraction failed → suggest retry
    const failedExtractions = recent.filter(
        (e) => e.eventType === 'file.extraction_failed',
    );
    if (failedExtractions.length > 0) {
        recs.push({
            id: 'rec-extraction-failed',
            title: `Text extraction failed for ${failedExtractions.length} file${failedExtractions.length > 1 ? 's' : ''}`,
            body: 'File content could not be extracted. Retry to enable AI analysis.',
            actionLabel: 'Open Files',
            actionUrl: '/files',
            priority: 'high',
            ...(failedExtractions[0]?.id && {
                sourceEventId: failedExtractions[0].id,
            }),
        });
    }

    // Rule: many todos completed → suggest day review
    const completedTodos = recent.filter(
        (e) => e.eventType === 'todo.completed',
    );
    if (completedTodos.length >= 5) {
        recs.push({
            id: 'rec-todos-completed',
            title: `${completedTodos.length} tasks completed today`,
            body: 'Great progress! Consider reviewing remaining tasks or archiving completed ones.',
            actionLabel: 'Open Tasks',
            actionUrl: '/',
            priority: 'normal',
        });
    }

    // Rule: artifact generated but not viewed (no read event nearby) → nudge
    const generatedArtifacts = recent.filter(
        (e) => e.eventType === 'artifact.generated' && !e.readAt,
    );
    if (generatedArtifacts.length > 0) {
        recs.push({
            id: 'rec-unread-artifacts',
            title: `${generatedArtifacts.length} unread artifact${generatedArtifacts.length > 1 ? 's' : ''}`,
            body: 'AI-generated content is waiting for your review.',
            actionLabel: 'View Artifacts',
            actionUrl: generatedArtifacts[0]?.actionUrl ?? '/artifacts',
            priority: 'normal',
            ...(generatedArtifacts[0]?.id && {
                sourceEventId: generatedArtifacts[0].id,
            }),
        });
    }

    // Rule: news items imported → suggest reading
    const newsImported = recent.filter((e) => e.eventType === 'news.imported');
    const totalNewsCount = newsImported.reduce((sum, e) => {
        return sum + ((e.metadata.articleCount as number | undefined) ?? 1);
    }, 0);
    if (totalNewsCount >= 10) {
        recs.push({
            id: 'rec-news-imported',
            title: `${totalNewsCount} news articles available`,
            body: 'Recent RSS imports added new articles to your feed.',
            actionLabel: 'Open News',
            actionUrl: '/news',
            priority: 'normal',
        });
    }

    // Rule: email actions extracted → suggest acting on them
    const emailActions = recent.filter(
        (e) => e.eventType === 'email.action_extracted',
    );
    if (emailActions.length > 0) {
        recs.push({
            id: 'rec-email-actions',
            title: 'AI found actionable emails',
            body: 'New tasks and deadlines were extracted from your inbox.',
            actionLabel: 'Open Inbox',
            actionUrl: '/inbox',
            priority: 'normal',
            ...(emailActions[0]?.id && {
                sourceEventId: emailActions[0].id,
            }),
        });
    }

    // Rule: research failed
    const failedResearch = recent.filter(
        (e) => e.eventType === 'research.failed',
    );
    if (failedResearch.length > 0) {
        recs.push({
            id: 'rec-research-failed',
            title: 'Research pipeline failed',
            body: 'A research job did not complete. Check logs and retry.',
            actionLabel: 'Open Research',
            actionUrl: '/research',
            priority: 'high',
            ...(failedResearch[0]?.id && {
                sourceEventId: failedResearch[0].id,
            }),
        });
    }

    return recs;
}
