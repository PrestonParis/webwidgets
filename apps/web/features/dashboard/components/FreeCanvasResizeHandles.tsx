'use client';

import { cn } from '@/lib/utils/utils';

interface FreeCanvasResizeHandlesProps {
    id: string;
    isResizingThis: boolean;
    onResizeDown: (
        id: string,
        e: React.PointerEvent<HTMLDivElement>,
        axis: 'x' | 'y' | 'both',
    ) => void;
    onResizeMove: (id: string, e: React.PointerEvent<HTMLDivElement>) => void;
    onResizeUp: (id: string) => void;
}

export function FreeCanvasResizeHandles({
    id,
    isResizingThis,
    onResizeDown,
    onResizeMove,
    onResizeUp,
}: FreeCanvasResizeHandlesProps) {
    return (
        <>
            <div
                className="absolute top-6 bottom-6 -right-1.5 w-4 flex items-center justify-center cursor-col-resize z-30 opacity-0 group-hover/item:opacity-100 transition-opacity"
                data-no-drag
                onPointerDown={(e) => onResizeDown(id, e, 'x')}
                onPointerMove={(e) => onResizeMove(id, e)}
                onPointerUp={() => onResizeUp(id)}
                onPointerCancel={() => onResizeUp(id)}
            >
                <div
                    className={cn(
                        'w-0.75 h-8 rounded-full transition-colors',
                        isResizingThis
                            ? 'bg-blue-500'
                            : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-500',
                    )}
                />
            </div>
            <div
                className="absolute left-6 right-6 -bottom-1.5 h-4 flex items-center justify-center cursor-row-resize z-30 opacity-0 group-hover/item:opacity-100 transition-opacity"
                data-no-drag
                onPointerDown={(e) => onResizeDown(id, e, 'y')}
                onPointerMove={(e) => onResizeMove(id, e)}
                onPointerUp={() => onResizeUp(id)}
                onPointerCancel={() => onResizeUp(id)}
            >
                <div
                    className={cn(
                        'h-0.75 w-8 rounded-full transition-colors',
                        isResizingThis
                            ? 'bg-blue-500'
                            : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-500',
                    )}
                />
            </div>
            <div
                className="absolute -bottom-1.5 -right-1.5 w-5 h-5 flex items-center justify-center cursor-nwse-resize z-30 opacity-0 group-hover/item:opacity-100 transition-opacity"
                data-no-drag
                onPointerDown={(e) => onResizeDown(id, e, 'both')}
                onPointerMove={(e) => onResizeMove(id, e)}
                onPointerUp={() => onResizeUp(id)}
                onPointerCancel={() => onResizeUp(id)}
            >
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-sm transition-colors',
                        isResizingThis
                            ? 'bg-blue-500'
                            : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-500',
                    )}
                />
            </div>
        </>
    );
}
