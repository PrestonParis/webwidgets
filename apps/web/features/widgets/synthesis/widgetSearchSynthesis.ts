import FlexSearch from 'flexsearch';
import type { WidgetSynthesisCandidate } from './widgetBuilderInterfaces';
import type { SynthesizedWidgetDefinition } from './widgetDefinitionInterfaces';
import { DATA_SOURCE_REGISTRY } from './dataSourceRegistry';
import {
    createEmptyDefinition,
    assembleDraftWidget,
} from './widgetAssemblyEngine';
import { planWidgetSynthesis } from '@/features/widgets/synthesis/engine/synthesisPlanner';
import { parseWidgetIntent } from '@/features/widgets/synthesis/engine/intentParser';

interface TemplateRule {
    keywords: string[];
    title: string;
    description: string;
    emoji: string;
    examples: string[];
}

const BLUEPRINT_TEMPLATES: TemplateRule[] = [
    {
        keywords: ['subscription', 'recurring', 'charge', 'billing', 'renewal'],
        title: 'Subscription Risk',
        description:
            'Track recurring charges, renewal timing, and subscription creep.',
        emoji: '🔄',
        examples: ['subscription risk', 'renewal reminders'],
    },
    {
        keywords: ['cashflow', 'forecast', 'income', 'expense', 'budget'],
        title: 'Cashflow Forecast',
        description: 'Visualize income, expense, and runway projections.',
        emoji: '💸',
        examples: ['cashflow forecast', 'monthly cash runway'],
    },
    {
        keywords: ['email', 'follow-up', 'missed', 'reply', 'inbox'],
        title: 'Missed Email Follow-Up Tracker',
        description:
            'Rank messages that likely need a response or next action.',
        emoji: '📬',
        examples: ['missed email follow-up tracker'],
    },
    {
        keywords: ['recovery', 'relapse', 'sober', 'risk', 'streak'],
        title: 'Recovery Relapse Risk',
        description:
            'Combine streak, mood, and routine signals into a risk monitor.',
        emoji: '🌱',
        examples: ['recovery relapse risk'],
    },
    {
        keywords: ['weekly', 'family', 'planning', 'calendar', 'agenda'],
        title: 'Weekly Family Planning',
        description:
            'Blend calendar events, tasks, and reminders into a weekly planning surface.',
        emoji: '📅',
        examples: ['weekly family planning'],
    },
    {
        keywords: ['research', 'briefing', 'article', 'paper', 'summary'],
        title: 'Research Briefing',
        description: 'Summarize research items, sources, and open questions.',
        emoji: '🔎',
        examples: ['research briefing'],
    },
    {
        keywords: ['news', 'bias', 'source', 'political', 'timeline'],
        title: 'AI News Bias Tracker',
        description:
            'Compare sources, entities, and framing across news events.',
        emoji: '🗞️',
        examples: ['AI news bias tracker', 'political event timeline'],
    },
    {
        keywords: ['invoice', 'aging', 'receivable', 'client'],
        title: 'Invoice Aging',
        description: 'Bucket invoices by age, amount, and risk.',
        emoji: '🧾',
        examples: ['invoice aging'],
    },
    {
        keywords: ['habit', 'energy', 'correlation', 'mood', 'sleep'],
        title: 'Habit-Energy Correlation',
        description: 'Compare habits against energy and mood over time.',
        emoji: '⚡',
        examples: ['habit-energy correlation'],
    },
    {
        keywords: ['portfolio', 'drawdown', 'market', 'watchlist', 'risk'],
        title: 'Portfolio Drawdown Monitor',
        description: 'Track asset drawdowns and alert thresholds.',
        emoji: '📉',
        examples: ['portfolio drawdown monitor'],
    },
    {
        keywords: ['burnout', 'focus', 'context', 'productivity'],
        title: 'Burnout Prediction',
        description:
            'Use workload, focus, and task pressure as an early warning surface.',
        emoji: '🔥',
        examples: ['burnout prediction'],
    },
    {
        keywords: ['github', 'issue', 'pull', 'review', 'deploy'],
        title: 'Developer Triage',
        description:
            'Unify GitHub activity, tasks, and observability into a triage card.',
        emoji: '🧰',
        examples: ['github review triage'],
    },
];

const searchIndex = new FlexSearch.Index({ tokenize: 'forward', cache: true });
for (const template of BLUEPRINT_TEMPLATES) {
    searchIndex.add(
        template.title,
        `${template.title} ${template.description} ${template.keywords.join(' ')} ${template.examples.join(' ')}`,
    );
}

function tokenize(query: string): string[] {
    return query
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length > 2);
}

function templateScore(template: TemplateRule, tokens: string[]) {
    const hits = tokens.filter((token) =>
        template.keywords.some(
            (keyword) => keyword.includes(token) || token.includes(keyword),
        ),
    ).length;
    return hits / Math.max(tokens.length, 1);
}

function planToDraft(
    template: TemplateRule,
    query: string,
): SynthesizedWidgetDefinition {
    const plan = planWidgetSynthesis(query || template.title);
    return createEmptyDefinition({
        name: template.title,
        description: template.description,
        category: plan.intent.domain,
        purpose: plan.intent.purpose,
        icon: template.emoji,
        layout: plan.layout,
        dataSources: plan.dataSources.map((id) => {
            const reg = DATA_SOURCE_REGISTRY.find((source) => source.id === id);
            return {
                id,
                type: id === 'api.custom' ? 'api' : 'feature_data',
                label: reg?.label ?? id,
                schema: reg?.schema ?? {},
                transformations: plan.transformations,
                unavailableReason: reg?.unavailableReason,
            };
        }),
        transformations: plan.transformations.map((type) => ({
            type,
            config: defaultTransformConfig(type),
        })),
        components: plan.components.map((registryId, order) => ({
            registryId,
            props: {},
            order,
        })),
        actions: plan.actions.map((registryId) => ({
            registryId,
            label: registryId,
        })),
        permissions: plan.permissions,
        metadata: {
            version: '1.0.0',
            createdBy: 'ai',
            tags: [
                ...new Set([
                    ...template.keywords.slice(0, 5),
                    plan.intent.domain,
                ]),
            ],
            complexity: plan.intent.complexity,
            intentQuery: query,
            buildableNow: plan.buildableNow,
            missingCapabilities: plan.missingRequirements,
        },
    });
}

function defaultTransformConfig(
    type: SynthesizedWidgetDefinition['transformations'][number]['type'],
): Record<string, unknown> {
    switch (type) {
        case 'time_window':
            return { dateField: 'date', window: 'month' };
        case 'group_by_time':
            return { dateField: 'date', unit: 'week', aggregation: 'count' };
        case 'correlation_placeholder':
            return { leftMetric: 'value', rightMetric: 'score' };
        case 'score':
            return { outputField: 'score', factors: ['recency', 'priority'] };
        case 'summarization_placeholder':
            return { textField: 'summary', mode: 'brief' };
        case 'normalize_records':
            return { fields: {} };
        default:
            return {};
    }
}

export function synthesizeWidgetFromQuery(
    query: string,
): WidgetSynthesisCandidate[] {
    if (!query.trim()) return [];
    const tokens = tokenize(query);
    const indexedTitles = new Set(searchIndex.search(query, 8).map(String));
    const intent = parseWidgetIntent(query);
    const templates = BLUEPRINT_TEMPLATES.map((template) => ({
        template,
        score: Math.max(
            indexedTitles.has(template.title) ? 0.55 : 0,
            templateScore(template, tokens),
        ),
    }))
        .filter(
            ({ score, template }) =>
                score > 0 || template.keywords.includes(intent.domain),
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

    const fallback =
        templates.length > 0
            ? templates
            : [
                  {
                      template: {
                          keywords: [intent.domain],
                          title: `${intent.domain[0]?.toUpperCase() ?? ''}${intent.domain.slice(1)} Widget`,
                          description: `Generated ${intent.domain} widget draft from your request.`,
                          emoji: '🧩',
                          examples: [query],
                      },
                      score: 0.42,
                  },
              ];

    return fallback.map(({ template, score }) => {
        const draft = planToDraft(template, query);
        const assembled = assembleDraftWidget(draft);
        return {
            id: `synthesis-${template.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
            title: template.title,
            description: template.description,
            confidence: Math.min(
                1,
                Math.max(score, draft.metadata.buildableNow ? 0.62 : 0.48),
            ),
            emoji: template.emoji,
            requiredDataSources: draft.dataSources.map((source) => source.id),
            suggestedComponents: draft.components.map(
                (component) => component.registryId,
            ),
            suggestedActions: draft.actions.map((action) => action.registryId),
            missingCapabilities: assembled.missingCapabilities ?? [],
            buildableNow: assembled.buildableNow,
            requiredPermissions: draft.permissions.map((permission) =>
                String(permission.scope),
            ),
            explanation: [
                `${draft.metadata.complexity} ${draft.purpose} widget`,
                assembled.buildableNow
                    ? 'Buildable now from current capabilities'
                    : 'Requires setup or fallback data',
            ],
            definitionDraft: draft,
        };
    });
}

export function findMatchingDataSources(
    query: string,
): typeof DATA_SOURCE_REGISTRY {
    const q = query.toLowerCase();
    return DATA_SOURCE_REGISTRY.filter(
        (ds) =>
            ds.label.toLowerCase().includes(q) ||
            ds.description.toLowerCase().includes(q) ||
            ds.category.includes(q),
    );
}

export function listBlueprintWidgetTemplates() {
    return BLUEPRINT_TEMPLATES;
}
