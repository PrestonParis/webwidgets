import type { ContextFilterState } from '@/features/context/components/ContextFilters';
import type { GraphLayoutMode } from '@/features/context/components/GraphToolbar';

export type GraphMode =
    | 'architecture'
    | 'data_flow'
    | 'recommendation'
    | 'user'
    | 'memory';

export const GRAPH_MODE_LABELS: Record<GraphMode, string> = {
    architecture: 'Architecture',
    data_flow: 'Data flow',
    recommendation: 'Recommendation',
    user: 'User',
    memory: 'Memory',
};

interface GraphModePreset {
    layoutMode: GraphLayoutMode;
    filters: Partial<ContextFilterState>;
}

// Each mode is a preset combination of the existing layout + filter
// mechanics — not a parallel filtering system. Allowlisted node types are
// expanded to their immediate neighbors by `applyGraphView` so a mode never
// renders isolated dots with no context.
export const GRAPH_MODE_PRESETS: Record<GraphMode, GraphModePreset> = {
    architecture: {
        layoutMode: 'galaxy',
        filters: {},
    },
    data_flow: {
        layoutMode: 'cluster',
        filters: {
            edgeKindAllowlist: [
                'depends_on',
                'produced_by',
                'consumed_by',
                'triggered_by',
                'used_by',
            ],
        },
    },
    recommendation: {
        layoutMode: 'cluster',
        filters: {
            entryTypeAllowlist: ['recommendation'],
            edgeKindAllowlist: ['supports_goal', 'relates_to'],
        },
    },
    user: {
        layoutMode: 'galaxy',
        filters: {
            entryTypeBlocklist: [
                'widget_activity',
                'automation_run',
                'agent_action',
            ],
        },
    },
    memory: {
        layoutMode: 'cluster',
        filters: {
            entryTypeAllowlist: ['memory', 'query_gist', 'chat_gist', 'insight'],
        },
    },
};
