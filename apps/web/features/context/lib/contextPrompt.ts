import type { ContextGraph } from '@/features/context/types/context';
import type { ContextPermissions } from '@/features/context/types/context';

function summarizeData(data: Record<string, unknown>): string {
    const parts: string[] = [];
    if (typeof data['lastInteraction'] === 'string')
        parts.push(`last used: ${data['lastInteraction']}`);
    if (typeof data['notes'] === 'string' && data['notes'])
        parts.push(data['notes']);
    if (typeof data['count'] === 'number')
        parts.push(`count: ${data['count']}`);
    if (typeof data['streak'] === 'number')
        parts.push(`streak: ${data['streak']} days`);
    if (Array.isArray(data['recentTopics'])) {
        const topics = (data['recentTopics'] as unknown[]).filter(
            (t) => typeof t === 'string',
        );
        if (topics.length > 0) parts.push(`topics: ${topics.join(', ')}`);
    }
    return parts.join('; ');
}

export function buildSystemPrompt(
    graph: ContextGraph,
    permissions: ContextPermissions,
): string {
    const profile = graph.nodes.find((n) => n.entryType === 'profile');
    const goals = graph.nodes.filter((n) => n.entryType === 'goal');
    const widgets = graph.nodes.filter((n) => n.entryType === 'widget');
    const integrations = graph.nodes.filter(
        (n) => n.entryType === 'integration',
    );
    const insights = graph.nodes.filter((n) => n.entryType === 'insight');
    const gists = permissions.includeQueryGists
        ? graph.nodes.filter((n) => n.entryType === 'query_gist')
        : [];

    const lines: string[] = [
        "You are a personalized AI assistant embedded in the user's WebWidgets workspace.",
        'Use the context below to give tailored, relevant responses.',
        '',
    ];

    if (profile) {
        lines.push(`## User Profile`);
        lines.push(`Name: ${profile.label}`);
        const summary = summarizeData(profile.data);
        if (summary) lines.push(`Details: ${summary}`);
        lines.push('');
    }

    if (goals.length > 0) {
        lines.push('## Goals');
        goals.forEach((g) => {
            const summary = summarizeData(g.data);
            lines.push(`- ${g.label}${summary ? ` (${summary})` : ''}`);
        });
        lines.push('');
    }

    if (widgets.length > 0 && permissions.captureWidgetInteractions) {
        lines.push('## Active Workspace');
        widgets.forEach((w) => {
            const summary = summarizeData(w.data);
            lines.push(`- ${w.label}${summary ? `: ${summary}` : ''}`);
        });
        lines.push('');
    }

    if (integrations.length > 0) {
        lines.push('## Connected Integrations');
        integrations.forEach((i) => lines.push(`- ${i.label}`));
        lines.push('');
    }

    if (insights.length > 0) {
        lines.push('## Observed Patterns');
        insights.forEach((i) =>
            lines.push(`- ${i.label}: ${summarizeData(i.data)}`),
        );
        lines.push('');
    }

    if (gists.length > 0) {
        lines.push('## Recent Conversation Context');
        gists.slice(-5).forEach((g) => lines.push(`- ${g.label}`));
        lines.push('');
    }

    lines.push(
        "Respond concisely. Reference the user's context naturally without reciting it verbatim.",
    );

    return lines.join('\n');
}

export function buildQueryGistLabel(userMessage: string): string {
    const words = userMessage.trim().split(/\s+/);
    const truncated = words.slice(0, 10).join(' ');
    return words.length > 10 ? `${truncated}…` : truncated;
}
