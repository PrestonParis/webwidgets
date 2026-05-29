import { screenSnapshotSchema } from '@/features/widgets/schemas/snapshotSchemas';
import { getWidgetManifest } from '@/features/widgets/registry/widgetManifest';
import { resolveWidgetData } from '@/features/widgets/server/resolveWidgetData';
import type {
    ResolverContext,
    ScreenSnapshot,
    WidgetManifest,
    WidgetSnapshot,
} from '@/features/widgets/types/snapshot';

export type ActiveWidgetInput = {
    id: string;
    type: string;
    visible?: boolean;
    containerId?: string;
    unpresented?: boolean;
};

export type DashboardOrchestratorContext = {
    userId?: string;
    requestId?: string;
    activeWidgets?: ActiveWidgetInput[];
};

const fallbackWidgetTypes = ['finance', 'currency', 'datahealth'];

function activeWidgetManifests(activeWidgets?: ActiveWidgetInput[]) {
    const candidates = activeWidgets?.length
        ? activeWidgets.filter(
              (widget) =>
                  widget.visible !== false &&
                  widget.containerId !== 'bucket' &&
                  widget.unpresented !== true,
          )
        : fallbackWidgetTypes.map((type) => ({ id: `widget-${type}`, type }));

    return candidates.flatMap((widget) => {
        const manifest = getWidgetManifest(widget.type);
        return manifest ? [{ widget, manifest }] : [];
    });
}

function snapshotStatus(
    manifest: WidgetManifest,
    resolved: Awaited<ReturnType<typeof resolveWidgetData>>,
): WidgetSnapshot['status'] {
    if (manifest.dataNeeds.length === 0) return 'ready';
    const results = manifest.dataNeeds.map((need) => resolved[need]);
    if (results.some((result) => !result || result.status === 'rejected'))
        return 'error';
    if (
        results.every(
            (result) =>
                result?.status === 'fulfilled' &&
                Array.isArray(result.data) &&
                result.data.length === 0,
        )
    ) {
        return 'empty';
    }
    return 'ready';
}

function snapshotData(
    manifest: WidgetManifest,
    resolved: Awaited<ReturnType<typeof resolveWidgetData>>,
) {
    if (manifest.dataNeeds.length === 0) return undefined;
    if (manifest.dataNeeds.length === 1)
        return resolved[manifest.dataNeeds[0] ?? '']?.data;

    return Object.fromEntries(
        manifest.dataNeeds.map((need) => [need, resolved[need]?.data]),
    );
}

/**
 * Extract compact preview data from snapshot for progressive rendering
 * This provides lightweight summary information before full hydration
 */
function extractCompactPreview(
    manifest: WidgetManifest,
    data: unknown,
): Record<string, unknown> | undefined {
    if (!data) return undefined;

    // Handle array data (common for lists, tasks, etc.)
    if (Array.isArray(data)) {
        const items = data as unknown[];
        const count = items.length;
        const firstItem = items[0];
        return {
            count,
            preview: firstItem
                ? JSON.stringify(firstItem).slice(0, 100)
                : undefined,
        };
    }

    // Handle object data
    if (typeof data === 'object' && data !== null) {
        const preview: Record<string, unknown> = {};

        // Extract common summary fields
        if ('count' in data) preview.count = data.count;
        if ('total' in data) preview.total = data.total;
        if ('title' in data) preview.title = data.title;
        if ('name' in data) preview.name = data.name;
        if ('status' in data) preview.status = data.status;
        if ('timestamp' in data) preview.timestamp = data.timestamp;
        if ('updatedAt' in data) preview.updatedAt = data.updatedAt;
        if ('createdAt' in data) preview.createdAt = data.createdAt;

        // If no standard fields, create a string preview
        if (Object.keys(preview).length === 0) {
            const str = JSON.stringify(data);
            preview.summary = str.slice(0, 150);
        }

        return preview;
    }

    return undefined;
}

export async function buildDashboardSnapshot(
    ctx: DashboardOrchestratorContext,
): Promise<ScreenSnapshot> {
    const active = activeWidgetManifests(ctx.activeWidgets);
    const dataNeeds = active.flatMap(({ manifest }) => manifest.dataNeeds);
    const resolverCtx: ResolverContext = {
        screen: 'dashboard',
        activeWidgetIds: active.map(({ widget }) => widget.id),
        ...(ctx.userId ? { userId: ctx.userId } : {}),
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    };
    const resolved = await resolveWidgetData(dataNeeds, resolverCtx);
    const generatedAt = new Date().toISOString();
    const widgets: Record<string, WidgetSnapshot> = {};

    for (const { widget, manifest } of active) {
        const status = snapshotStatus(manifest, resolved);
        const failedNeed = manifest.dataNeeds.find(
            (need) => resolved[need]?.status === 'rejected',
        );
        const data =
            status === 'ready' ? snapshotData(manifest, resolved) : undefined;
        const compactPreview = data
            ? extractCompactPreview(manifest, data)
            : undefined;

        widgets[widget.id] = {
            widgetId: widget.id,
            status,
            ...(data ? { data } : {}),
            ...(compactPreview ? { compactPreview } : {}),
            ...(status === 'error'
                ? {
                      error: resolved[failedNeed ?? '']?.error ?? {
                          code: 'RESOLVER_FAILED',
                          message: `${manifest.title} data is temporarily unavailable.`,
                      },
                  }
                : {}),
            generatedAt,
        };
    }

    return screenSnapshotSchema.parse({
        screen: 'dashboard',
        widgets,
        shared: Object.fromEntries(
            Object.entries(resolved)
                .filter(([, result]) => result.status === 'fulfilled')
                .map(([key, result]) => [key, result.data]),
        ),
        generatedAt,
    });
}
