import type {
    SynthesizedWidgetDefinition,
    SynthesizedPermissionDef,
} from './widgetDefinitionInterfaces';
import type {
    AssembledWidget,
    WidgetPreviewState,
} from './widgetBuilderInterfaces';
import { getComponent, COMPONENT_REGISTRY } from './componentRegistry';
import { getDataSource, DATA_SOURCE_REGISTRY } from './dataSourceRegistry';
import { getAction } from './actionRegistry';
import { validateWidgetDefinition, hasErrors } from './widgetValidation';
import type { WidgetPermission } from '@/features/platform/types/widgetTypes';
import { getTransformation } from '@/features/widgets/synthesis/transformationRegistry';

const PERMISSION_REASONS: Record<string, string> = {
    finance_data: 'Reads account balances, transactions, and financial records',
    tracking_sensitive: 'Accesses sensitive health and wellness tracking data',
    ai_analysis: 'Sends data to AI analysis service',
    automation_actions: 'Creates and triggers automation rules',
    external_imports: 'Fetches data from external API endpoints',
};

function buildPermissionDefs(
    dataSourceIds: string[],
    actionIds: string[],
): SynthesizedPermissionDef[] {
    const required = new Set<WidgetPermission>();

    for (const id of dataSourceIds) {
        const src = getDataSource(id);
        if (src) src.permissions.forEach((p) => required.add(p));
    }
    for (const id of actionIds) {
        const action = getAction(id);
        if (action) action.permissions.forEach((p) => required.add(p));
    }

    return [...required].map((scope) => ({
        scope,
        reason: PERMISSION_REASONS[scope] ?? `Requires ${scope} permission`,
        required: true,
    }));
}

function buildSampleData(
    def: SynthesizedWidgetDefinition,
): Record<string, unknown> {
    const sample: Record<string, unknown> = {};
    for (const src of def.dataSources) {
        const registered = getDataSource(src.id);
        if (!registered) continue;
        const row: Record<string, unknown> = {};
        for (const [field, type] of Object.entries(registered.schema)) {
            if (type === 'number')
                row[field] = Math.round(Math.random() * 1000);
            else if (type === 'boolean') row[field] = true;
            else if (type === 'string[]') row[field] = ['example', 'tag'];
            else row[field] = `sample-${field}`;
        }
        sample[src.id] = [row];
    }
    return sample;
}

function buildPreviewState(
    def: SynthesizedWidgetDefinition,
): WidgetPreviewState {
    return {
        mode: 'compact',
        sampleData: buildSampleData(def),
        resolvedComponents: def.components.map(
            (c) => getComponent(c.registryId)?.name ?? c.registryId,
        ),
        permissionSummary: def.permissions.map((p) => p.reason),
    };
}

export function resolveComponents(
    def: SynthesizedWidgetDefinition,
): typeof COMPONENT_REGISTRY {
    return def.components
        .map((c) => getComponent(c.registryId))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);
}

export function resolveDataSources(
    def: SynthesizedWidgetDefinition,
): typeof DATA_SOURCE_REGISTRY {
    return def.dataSources
        .map((ds) => getDataSource(ds.id))
        .filter((ds): ds is NonNullable<typeof ds> => ds !== undefined);
}

export function computeRequiredPermissions(
    def: SynthesizedWidgetDefinition,
): SynthesizedPermissionDef[] {
    return buildPermissionDefs(
        def.dataSources.map((ds) => ds.id),
        def.actions.map((a) => a.registryId),
    );
}

export function assembleWidget(
    def: SynthesizedWidgetDefinition,
): AssembledWidget {
    const issues = validateWidgetDefinition(def);
    const resolvedDataSourceList = resolveDataSources(def);
    const resolvedComponentList = resolveComponents(def);
    const requiredPermissions = computeRequiredPermissions(def);
    const preview = buildPreviewState(def);
    const missingCapabilities = [
        ...def.dataSources.flatMap((source) =>
            getDataSource(source.id)?.unavailableReason
                ? [
                      `${source.id}: ${getDataSource(source.id)?.unavailableReason}`,
                  ]
                : [],
        ),
        ...def.transformations.flatMap((transform) =>
            getTransformation(transform.type)
                ? []
                : [`Missing transformation: ${transform.type}`],
        ),
        ...def.components.flatMap((component) =>
            getComponent(component.registryId)
                ? []
                : [`Missing component: ${component.registryId}`],
        ),
        ...def.actions.flatMap((action) =>
            getAction(action.registryId)
                ? []
                : [`Missing action: ${action.registryId}`],
        ),
    ];

    return {
        definition: def,
        resolvedDataSources: resolvedDataSourceList.map((ds) => ds.id),
        resolvedComponents: resolvedComponentList.map((c) => c.id),
        resolvedActions: def.actions.map((a) => a.registryId),
        requiredPermissions,
        preview,
        isValid: !hasErrors(issues),
        issues,
        missingCapabilities,
        buildableNow: missingCapabilities.length === 0 && !hasErrors(issues),
    };
}

export function assembleDraftWidget(
    def: SynthesizedWidgetDefinition,
): AssembledWidget {
    const assembled = assembleWidget(def);
    return {
        ...assembled,
        isValid:
            assembled.issues.filter((issue) => issue.severity === 'error')
                .length === 0,
        buildableNow: assembled.missingCapabilities?.length === 0,
    };
}

export function createEmptyDefinition(
    overrides: Partial<SynthesizedWidgetDefinition> = {},
): SynthesizedWidgetDefinition {
    return {
        id: `widget-${Date.now()}`,
        name: '',
        description: '',
        category: 'custom',
        purpose: 'display',
        dataSources: [],
        transformations: [],
        layout: 'small_card',
        components: [],
        actions: [],
        automations: [],
        permissions: [],
        metadata: {
            version: '1.0.0',
            createdBy: 'user',
            tags: [],
            complexity: 'simple',
        },
        ...overrides,
    };
}

export function estimateComplexity(
    def: Partial<SynthesizedWidgetDefinition>,
): SynthesizedWidgetDefinition['metadata']['complexity'] {
    const score =
        (def.dataSources?.length ?? 0) * 2 +
        (def.components?.length ?? 0) +
        (def.actions?.length ?? 0) * 1.5 +
        (def.automations?.length ?? 0) * 2 +
        (def.transformations?.length ?? 0);
    if (score <= 4) return 'simple';
    if (score <= 10) return 'moderate';
    return 'advanced';
}

export function serializeDefinition(def: SynthesizedWidgetDefinition): string {
    return JSON.stringify(def);
}

export function deserializeDefinition(
    raw: string,
): SynthesizedWidgetDefinition | null {
    try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;
        if (!('id' in parsed) || !('name' in parsed)) return null;
        return parsed as SynthesizedWidgetDefinition;
    } catch {
        return null;
    }
}
