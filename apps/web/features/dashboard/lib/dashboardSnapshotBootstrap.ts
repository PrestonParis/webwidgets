import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

export const DASHBOARD_BOOTSTRAP_WIDGET_COUNT = 8;

export function dashboardSnapshotWidgetKey(layout: WidgetConfig[]) {
    return layout
        .map(
            (widget) =>
                `${widget.id}:${widget.type}:${widget.visible}:${widget.containerId}:${widget.unpresented ?? false}:${widget.order}`,
        )
        .join('|');
}

export function snapshotWidgets(layout: WidgetConfig[], limit?: number) {
    const widgets = layout
        .filter(
            (widget) =>
                widget.visible &&
                widget.containerId === 'main' &&
                widget.unpresented !== true &&
                widget.type !== 'folder',
        )
        .sort((a, b) => a.order - b.order)
        .slice(0, limit ?? layout.length);

    return widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        visible: widget.visible,
        containerId: widget.containerId,
        unpresented: widget.unpresented,
    }));
}
