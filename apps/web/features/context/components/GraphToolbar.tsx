'use client';

import {
    Download,
    Focus,
    Maximize2,
    Plus,
    RefreshCw,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type GraphLayoutMode = 'cluster' | 'workflow' | 'compact' | 'galaxy';

interface GraphToolbarProps {
    layoutMode: GraphLayoutMode;
    focusMode: boolean;
    onLayoutModeChange: (mode: GraphLayoutMode) => void;
    onFocusModeChange: (value: boolean) => void;
    onAddNode: () => void;
    onRefresh: () => void;
    onExport: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    fitView: () => void;
}

export function GraphToolbar({
    layoutMode,
    focusMode,
    onLayoutModeChange,
    onFocusModeChange,
    onAddNode,
    onRefresh,
    onExport,
    zoomIn,
    zoomOut,
    fitView,
}: GraphToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-1">
            <select
                value={layoutMode}
                onChange={(event) =>
                    onLayoutModeChange(event.target.value as GraphLayoutMode)
                }
                className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
                <option value="cluster">Clusters</option>
                <option value="workflow">Workflow lanes</option>
                <option value="compact">Compact</option>
                <option value="galaxy">Galaxy</option>
            </select>
            <IconButton title="Zoom in" onClick={zoomIn} icon={ZoomIn} />
            <IconButton title="Zoom out" onClick={zoomOut} icon={ZoomOut} />
            <IconButton title="Fit view" onClick={fitView} icon={Maximize2} />
            <IconButton
                title="Focus selected neighborhood"
                onClick={() => onFocusModeChange(!focusMode)}
                icon={Focus}
                active={focusMode}
            />
            <IconButton
                title="Add context node"
                onClick={onAddNode}
                icon={Plus}
            />
            <IconButton
                title="Export graph JSON"
                onClick={onExport}
                icon={Download}
            />
            <IconButton title="Refresh" onClick={onRefresh} icon={RefreshCw} />
        </div>
    );
}

function IconButton({
    title,
    onClick,
    icon: Icon,
    active = false,
}: {
    title: string;
    onClick: () => void;
    icon: LucideIcon;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100 ${
                active
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
            }`}
            title={title}
            aria-label={title}
        >
            <Icon size={15} />
        </button>
    );
}
