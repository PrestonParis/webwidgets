import { ACTION_REGISTRY } from '@/features/widgets/synthesis/actionRegistry';
import { COMPONENT_REGISTRY } from '@/features/widgets/synthesis/componentRegistry';
import { DATA_SOURCE_REGISTRY } from '@/features/widgets/synthesis/dataSourceRegistry';
import { TRANSFORMATION_REGISTRY } from '@/features/widgets/synthesis/transformationRegistry';
import type {
    CapabilityGraphNode,
    WidgetIntent,
} from '@/features/widgets/synthesis/widgetIntentInterfaces';

const LAYOUTS = [
    'small_card',
    'dense_dashboard_card',
    'full_page_module',
    'split',
    'grid',
    'chart_table',
    'timeline_detail',
    'feed_inspector',
    'kpi_drilldown',
    'form_preview',
    'comparison',
];

export function buildCapabilityGraph(): CapabilityGraphNode[] {
    return [
        ...DATA_SOURCE_REGISTRY.map(
            (source): CapabilityGraphNode => ({
                id: source.id,
                kind: 'data_source',
                label: source.label,
                domain: source.category,
                available: !source.unavailableReason,
                permissions: source.permissions,
                provides: Object.keys(source.schema),
                requires: source.permissions,
                unavailableReason: source.unavailableReason,
            }),
        ),
        ...COMPONENT_REGISTRY.map(
            (component): CapabilityGraphNode => ({
                id: component.id,
                kind: 'component',
                label: component.name,
                domain: component.category,
                available: true,
                permissions: [],
                provides: [component.acceptedDataShape],
                requires: component.requiredProps,
            }),
        ),
        ...TRANSFORMATION_REGISTRY.map(
            (transform): CapabilityGraphNode => ({
                id: transform.id,
                kind: 'transformation',
                label: transform.label,
                domain: transform.complexity,
                available: transform.safe,
                permissions: [],
                provides: [transform.outputShape],
                requires: [transform.inputShape],
            }),
        ),
        ...ACTION_REGISTRY.map(
            (action): CapabilityGraphNode => ({
                id: action.id,
                kind: 'action',
                label: action.label,
                domain: action.category,
                available: action.safe,
                permissions: action.permissions,
                provides: [action.category],
                requires: action.permissions,
                unavailableReason: action.safe
                    ? undefined
                    : 'Requires explicit confirmation boundary',
            }),
        ),
        ...LAYOUTS.map(
            (layout): CapabilityGraphNode => ({
                id: layout,
                kind: 'layout',
                label: layout.replace(/_/g, ' '),
                domain: 'layout',
                available: true,
                permissions: [],
                provides: [layout],
                requires: [],
            }),
        ),
    ];
}

export function findMissingCapabilities(
    intent: WidgetIntent,
    graph = buildCapabilityGraph(),
) {
    return intent.dataNeeds.flatMap((need) => {
        const hasAvailable = graph.some(
            (node) =>
                node.available &&
                node.kind === 'data_source' &&
                node.domain.includes(need),
        );
        return hasAvailable ? [] : [`No available ${need} data source`];
    });
}
