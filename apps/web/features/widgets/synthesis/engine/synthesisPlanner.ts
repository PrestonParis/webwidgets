import { match } from 'ts-pattern';
import { parseWidgetIntent } from '@/features/widgets/synthesis/engine/intentParser';
import {
    buildCapabilityGraph,
    findMissingCapabilities,
} from '@/features/widgets/synthesis/engine/capabilityGraph';
import type {
    SynthesizedPermissionDef,
    WidgetIntent,
    WidgetLayoutType,
    WidgetSynthesisPlan,
    WidgetTransformationType,
} from '@/features/widgets/synthesis/widgetDefinitionSchema';
import { DATA_SOURCE_REGISTRY } from '@/features/widgets/synthesis/dataSourceRegistry';
import { ACTION_REGISTRY } from '@/features/widgets/synthesis/actionRegistry';

function chooseLayout(intent: WidgetIntent): WidgetLayoutType {
    if (intent.visualizationNeeds.includes('timeline'))
        return 'timeline_detail';
    if (intent.visualizationNeeds.includes('feed')) return 'feed_inspector';
    if (
        intent.visualizationNeeds.includes('table') &&
        intent.visualizationNeeds.includes('chart')
    )
        return 'chart_table';
    if (intent.visualizationNeeds.includes('comparison')) return 'comparison';
    if (intent.purpose === 'connect_api') return 'form_preview';
    if (intent.visualizationNeeds.includes('chart')) return 'chart';
    if (intent.urgency === 'high') return 'dense_dashboard_card';
    return 'small_card';
}

function chooseComponents(intent: WidgetIntent): string[] {
    const components = new Set<string>();
    if (intent.visualizationNeeds.includes('metric'))
        components.add('metric-card');
    if (intent.visualizationNeeds.includes('chart'))
        components.add('line-chart');
    if (intent.visualizationNeeds.includes('table'))
        components.add('data-table');
    if (intent.visualizationNeeds.includes('timeline'))
        components.add('timeline-chart');
    if (intent.visualizationNeeds.includes('feed')) components.add('feed');
    if (intent.visualizationNeeds.includes('comparison'))
        components.add('split');
    if (intent.urgency === 'high') components.add('alert-card');
    components.add('empty-state');
    return [...components];
}

function chooseTransformations(
    intent: WidgetIntent,
): WidgetTransformationType[] {
    const transformations = new Set<WidgetTransformationType>();
    if (intent.timeHorizon !== 'unknown') transformations.add('time_window');
    if (intent.visualizationNeeds.includes('chart'))
        transformations.add('group_by_time');
    if (intent.rawQuery.toLowerCase().includes('correlation'))
        transformations.add('correlation_placeholder');
    if (intent.rawQuery.toLowerCase().includes('risk'))
        transformations.add('score');
    if (
        intent.rawQuery.toLowerCase().includes('bias') ||
        intent.rawQuery.toLowerCase().includes('briefing')
    )
        transformations.add('summarization_placeholder');
    transformations.add('normalize_records');
    return [...transformations];
}

function chooseSources(intent: WidgetIntent) {
    const domainAliases: Record<string, string[]> = {
        communication: ['email'],
        health: ['tracking'],
        recovery: ['tracking', 'recovery'],
        productivity: ['tasks', 'calendar'],
        research: ['research', 'notes'],
    };
    const needs = [
        ...intent.dataNeeds,
        ...(domainAliases[intent.domain] ?? []),
    ];
    const direct = DATA_SOURCE_REGISTRY.filter((source) =>
        needs.some(
            (need) =>
                source.category.includes(need) || source.id.includes(need),
        ),
    ).map((source) => source.id);
    return [...new Set(direct.length > 0 ? direct : ['manual.input'])].slice(
        0,
        4,
    );
}

function chooseActions(intent: WidgetIntent) {
    const actionIds = new Set<string>(['data.refresh', 'nav.open_detail']);
    if (intent.actionsNeeded.includes('notify') || intent.urgency === 'high')
        actionIds.add('notify.send_reminder');
    if (intent.actionsNeeded.includes('create_task'))
        actionIds.add('data.add_task');
    if (intent.purpose === 'analyze') actionIds.add('ai.summarize');
    return [...actionIds].filter((id) =>
        ACTION_REGISTRY.some((action) => action.id === id),
    );
}

function permissionDefs(
    sourceIds: string[],
    actionIds: string[],
): SynthesizedPermissionDef[] {
    const permissions = new Map<string, string>();
    for (const source of DATA_SOURCE_REGISTRY.filter((item) =>
        sourceIds.includes(item.id),
    )) {
        source.permissions.forEach((permission) =>
            permissions.set(permission, `Required by ${source.label}`),
        );
    }
    for (const action of ACTION_REGISTRY.filter((item) =>
        actionIds.includes(item.id),
    )) {
        action.permissions.forEach((permission) =>
            permissions.set(permission, `Required by ${action.label}`),
        );
    }
    return [...permissions.entries()].map(([scope, reason]) => ({
        scope,
        reason,
        required: true,
    }));
}

export function planWidgetSynthesis(query: string): WidgetSynthesisPlan {
    const intent = parseWidgetIntent(query);
    const graph = buildCapabilityGraph();
    const dataSources = chooseSources(intent);
    const actions = chooseActions(intent);
    const missingRequirements = findMissingCapabilities(intent, graph);
    const buildableNow =
        missingRequirements.length === 0 &&
        dataSources.some((source) => !source.includes('oauth_placeholder'));
    const layout = chooseLayout(intent);
    const confidence = Math.max(
        0.38,
        Math.min(
            0.96,
            0.52 +
                dataSources.length * 0.08 +
                actions.length * 0.03 -
                missingRequirements.length * 0.08,
        ),
    );

    return {
        id: `plan-${Math.abs(query.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)).toString(36)}`,
        intent,
        dataSources,
        fallbackDataSources: buildableNow
            ? ['manual.input']
            : ['manual.input', 'api.custom'],
        transformations: chooseTransformations(intent),
        components: chooseComponents(intent),
        layout,
        actions,
        permissions: permissionDefs(dataSources, actions),
        previewStrategy: match(intent.purpose)
            .with('connect_api', () => 'api_test_result' as const)
            .with('track', () => 'sample_data' as const)
            .otherwise(() =>
                buildableNow
                    ? ('mock_provider' as const)
                    : ('empty_state' as const),
            ),
        missingRequirements,
        confidence,
        buildableNow,
        explanation: [
            `Detected ${intent.domain} intent with ${intent.purpose} purpose.`,
            `Selected ${layout.replace(/_/g, ' ')} layout for ${intent.visualizationNeeds.join(', ')} output.`,
            buildableNow
                ? 'All required capability categories are represented.'
                : 'Some capabilities require setup or custom API wiring.',
        ],
    };
}
