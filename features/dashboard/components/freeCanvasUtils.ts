import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { WIDGET_CATALOG } from '@/features/search/lib/widgetCatalog';
import { GRID, WIDGET_W, ROW_STRIDE } from './freeCanvasConfig';

export const INTERACTIVE =
    'input, select, textarea, button, a, [contenteditable="true"], [data-no-drag]';

export type Pos = { x: number; y: number };
export type Size = { w: number; h: number };
export type GuideLine = { axis: 'x' | 'y'; value: number };

const COL_STRIDE = WIDGET_W + GRID;

export function autoPos(index: number): Pos {
    return {
        x: (index % 3) * COL_STRIDE,
        y: Math.floor(index / 3) * ROW_STRIDE,
    };
}

export function applyGridSnap(v: number) {
    return Math.round(v / GRID) * GRID;
}

export function closestEdgeMidpoints(pa: Pos, sa: Size, pb: Pos, sb: Size) {
    const acx = pa.x + sa.w / 2,
        acy = pa.y + sa.h / 2;
    const bcx = pb.x + sb.w / 2,
        bcy = pb.y + sb.h / 2;
    const dx = bcx - acx,
        dy = bcy - acy;
    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0
            ? { x1: pa.x + sa.w, y1: acy, x2: pb.x, y2: bcy }
            : { x1: pa.x, y1: acy, x2: pb.x + sb.w, y2: bcy };
    } else {
        return dy >= 0
            ? { x1: acx, y1: pa.y + sa.h, x2: bcx, y2: pb.y }
            : { x1: acx, y1: pa.y, x2: bcx, y2: pb.y + sb.h };
    }
}

export function removeGlueGroupId(w: WidgetConfig): WidgetConfig {
    const { glueGroupId: _r, ...rest } = w;
    return rest as WidgetConfig;
}

export function removeWeaveGroupId(w: WidgetConfig): WidgetConfig {
    const { weaveGroupId: _r, ...rest } = w;
    return rest as WidgetConfig;
}

export function getWidgetLabel(config: WidgetConfig): string {
    if (config.type === 'folder') return config.props?.folderName ?? 'Folder';
    return (
        WIDGET_CATALOG.find((c) => c.type === config.type)?.name ?? config.type
    );
}

export function getWidgetEmoji(config: WidgetConfig): string {
    if (config.type === 'folder') return '📁';
    return WIDGET_CATALOG.find((c) => c.type === config.type)?.emoji ?? '🔲';
}
