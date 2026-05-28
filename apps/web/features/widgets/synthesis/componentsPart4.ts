import type { WidgetComponentCategory } from './widgetTypes';
import type { ComponentRegistryEntry } from './componentTypes';

function comp(
    id: string,
    name: string,
    cat: WidgetComponentCategory,
    desc: string,
    shape: string,
    req: string[],
    allowed: string[],
    preview = '',
): ComponentRegistryEntry {
    return {
        id,
        name,
        category: cat,
        description: desc,
        acceptedDataShape: shape,
        requiredProps: req,
        allowedProps: allowed,
        preview,
        supportedLayouts: [
            'small_card',
            'dense_dashboard_card',
            'full_page_module',
            'panel',
        ],
        supportedActions: ['data.refresh', 'nav.open_detail'],
        emptyState: 'No data available',
        loadingState: 'Skeleton rows',
        errorState: 'Inline retry panel',
        accessibilityNotes:
            'Expose labels, values, and actions with semantic text.',
        previewSupport: true,
    };
}

export const COMPONENT_REGISTRY_PART_4: ComponentRegistryEntry[] = [
    comp(
        'radar-chart',
        'Radar Chart',
        'visualization',
        'Multi-axis comparison spider chart',
        'array',
        ['data'],
        ['data', 'axes', 'color', 'filled', 'height'],
    ),
    comp(
        'gauge',
        'Gauge',
        'visualization',
        'Arc meter for ratio or percentage values',
        'scalar',
        ['value', 'max'],
        ['value', 'max', 'color', 'label', 'zones', 'height'],
    ),
    comp(
        'heatmap',
        'Heatmap',
        'visualization',
        'Color-encoded grid for density or intensity data',
        'matrix',
        ['data'],
        ['data', 'colorScale', 'xLabels', 'yLabels', 'height'],
    ),
    comp(
        'timeline-chart',
        'Timeline',
        'visualization',
        'Horizontal event timeline with date markers',
        'array',
        ['events'],
        ['events', 'dateKey', 'labelKey', 'color', 'height'],
    ),
    comp(
        'network-graph',
        'Network Graph',
        'visualization',
        'Force-directed node-edge relationship graph',
        'graph',
        ['nodes', 'edges'],
        ['nodes', 'edges', 'nodeColor', 'edgeColor', 'height'],
    ),
    comp(
        'map-placeholder',
        'Map Placeholder',
        'visualization',
        'Map-ready placeholder until geospatial rendering is added',
        'array',
        ['points'],
        ['points', 'latKey', 'lngKey'],
    ),
    comp(
        'relationship-graph-placeholder',
        'Relationship Graph Placeholder',
        'visualization',
        'Graph-ready placeholder for future relationship views',
        'graph',
        ['nodes', 'edges'],
        ['nodes', 'edges'],
    ),
];
