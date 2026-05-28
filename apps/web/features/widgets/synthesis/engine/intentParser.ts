import type {
    WidgetBuilderPurpose,
    WidgetComplexity,
    WidgetIntentDomain,
} from '@/features/widgets/types/synthesisWidgets';
import type { WidgetIntent } from '@/features/widgets/synthesis/widgetIntentInterfaces';

const DOMAIN_TERMS: Record<WidgetIntentDomain, string[]> = {
    finance: [
        'cashflow',
        'invoice',
        'subscription',
        'portfolio',
        'drawdown',
        'budget',
        'spending',
        'bill',
        'finance',
        'payment',
    ],
    communication: [
        'email',
        'inbox',
        'follow-up',
        'message',
        'reply',
        'newsletter',
    ],
    productivity: [
        'task',
        'planning',
        'habit',
        'goal',
        'focus',
        'weekly',
        'family',
        'agenda',
    ],
    health: ['sleep', 'energy', 'workout', 'symptom', 'health', 'mood'],
    recovery: ['recovery', 'relapse', 'sober', 'sobriety', 'streak'],
    research: [
        'research',
        'briefing',
        'paper',
        'citation',
        'reading',
        'knowledge',
    ],
    news: ['news', 'bias', 'political', 'event', 'timeline', 'rss'],
    calendar: ['calendar', 'schedule', 'meeting', 'event'],
    developer: ['github', 'pull request', 'deploy', 'issue'],
    weather: ['weather', 'forecast', 'storm'],
    sports: ['sports', 'score', 'team'],
    custom: ['api', 'endpoint', 'custom'],
    system: ['system', 'automation', 'workflow'],
};

function includesAny(text: string, terms: string[]) {
    return terms.some((term) => text.includes(term));
}

function inferDomain(text: string): WidgetIntentDomain {
    const scored = Object.entries(DOMAIN_TERMS)
        .map(([domain, terms]) => ({
            domain: domain as WidgetIntentDomain,
            score: terms.filter((term) => text.includes(term)).length,
        }))
        .sort((a, b) => b.score - a.score);
    return scored[0]?.score ? scored[0].domain : 'custom';
}

function inferPurpose(text: string): WidgetBuilderPurpose {
    if (
        includesAny(text, [
            'forecast',
            'correlation',
            'trend',
            'chart',
            'drawdown',
        ])
    )
        return 'visualize';
    if (
        includesAny(text, [
            'risk',
            'monitor',
            'alert',
            'tracker',
            'aging',
            'missed',
        ])
    )
        return 'monitor';
    if (includesAny(text, ['plan', 'planning', 'agenda'])) return 'plan';
    if (includesAny(text, ['api', 'endpoint', 'fetch'])) return 'connect_api';
    if (includesAny(text, ['briefing', 'summarize', 'analysis', 'bias']))
        return 'analyze';
    if (includesAny(text, ['habit', 'log', 'track'])) return 'track';
    return 'display';
}

function inferVisualizationNeeds(
    text: string,
): WidgetIntent['visualizationNeeds'] {
    const needs: WidgetIntent['visualizationNeeds'] = [];
    if (includesAny(text, ['forecast', 'trend', 'correlation', 'drawdown']))
        needs.push('chart');
    if (includesAny(text, ['timeline', 'event'])) needs.push('timeline');
    if (includesAny(text, ['feed', 'news', 'email', 'briefing']))
        needs.push('feed');
    if (includesAny(text, ['invoice', 'aging', 'table'])) needs.push('table');
    if (includesAny(text, ['compare', 'correlation', 'vs']))
        needs.push('comparison');
    if (includesAny(text, ['risk', 'score', 'kpi'])) needs.push('metric');
    return needs.length > 0 ? needs : ['metric'];
}

function inferTimeHorizon(text: string): WidgetIntent['timeHorizon'] {
    if (includesAny(text, ['real-time', 'live', 'now'])) return 'realtime';
    if (includesAny(text, ['today', 'daily'])) return 'today';
    if (includesAny(text, ['weekly', 'week'])) return 'week';
    if (includesAny(text, ['monthly', 'month', 'invoice aging']))
        return 'month';
    if (includesAny(text, ['quarter', 'q1', 'q2', 'q3', 'q4']))
        return 'quarter';
    if (includesAny(text, ['forecast', 'long', 'year'])) return 'long_range';
    return 'unknown';
}

function inferComplexity(text: string, dataNeeds: string[]): WidgetComplexity {
    const advancedSignals = [
        'correlation',
        'forecast',
        'bias',
        'drawdown',
        'risk',
        'timeline',
        'workflow',
    ];
    if (dataNeeds.length >= 3 || includesAny(text, advancedSignals))
        return 'advanced';
    if (
        dataNeeds.length >= 2 ||
        includesAny(text, ['tracker', 'planning', 'briefing'])
    )
        return 'moderate';
    return 'simple';
}

export function parseWidgetIntent(query: string): WidgetIntent {
    const text = query.toLowerCase().trim();
    const domain = inferDomain(text);
    const visualizationNeeds = inferVisualizationNeeds(text);
    const dataNeeds = [
        ...new Set([
            domain,
            ...Object.entries(DOMAIN_TERMS).flatMap(([candidate, terms]) =>
                includesAny(text, terms) ? [candidate] : [],
            ),
        ]),
    ];

    return {
        rawQuery: query,
        domain,
        purpose: inferPurpose(text),
        entities: text
            .split(/\s+/)
            .filter(
                (token) =>
                    token.length > 3 &&
                    !['tracker', 'monitor', 'forecast', 'widget'].includes(
                        token,
                    ),
            )
            .slice(0, 8),
        dataNeeds,
        timeHorizon: inferTimeHorizon(text),
        visualizationNeeds,
        actionsNeeded: includesAny(text, ['notify', 'alert', 'remind'])
            ? ['notify']
            : includesAny(text, ['task', 'follow-up'])
              ? ['create_task']
              : [],
        urgency: includesAny(text, ['risk', 'missed', 'alert', 'urgent'])
            ? 'high'
            : 'normal',
        privacySensitivity: [
            'finance',
            'health',
            'recovery',
            'communication',
        ].includes(domain)
            ? 'high'
            : 'medium',
        likelyIntegrations: dataNeeds.filter(
            (need) => !['custom', 'system'].includes(need),
        ),
        complexity: inferComplexity(text, dataNeeds),
    };
}
