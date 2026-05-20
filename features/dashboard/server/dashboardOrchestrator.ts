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
        widgets[widget.id] = {
            widgetId: widget.id,
            status,
            ...(status === 'ready'
                ? { data: snapshotData(manifest, resolved) }
                : {}),
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
