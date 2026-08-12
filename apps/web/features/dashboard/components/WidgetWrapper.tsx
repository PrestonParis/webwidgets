'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useReducedMotion } from 'framer-motion';
import { useAccessibility } from '@/features/accessibility/components/AccessibilityContext';
import { WidgetWrapperProps } from '@/features/dashboard/types/dashboard';
import { WidgetSize } from '@/features/widgets/types/widgets';
import { SIZE_LABELS } from '@/features/widgets/constants';
import { cn } from '@/lib/utils/utils';
import { HideWidgetContext } from '@/features/dashboard/lib/HideWidgetContext';
import { RemoveWidgetContext } from '@/features/dashboard/lib/RemoveWidgetContext';
import { BucketWidgetContext } from '@/features/dashboard/lib/BucketWidgetContext';
import { UnpresentWidgetContext } from '@/features/dashboard/lib/UnpresentWidgetContext';
import { StatusDot } from '@/features/notifications/components/StatusDot';
import { WidgetContextChip } from '@/features/dashboard/components/WidgetContextChip';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useWidgetResize } from '@/features/dashboard/hooks/useWidgetResize';

const sizeClasses: Record<WidgetSize, string> = {
    compact: 'col-span-1',
    default: 'col-span-1',
    wide: 'col-span-2',
    large: 'col-span-2 row-span-2',
};

// ─── resize handles ───────────────────────────────────────────────────────────

interface ResizeHandlesProps {
    isResizing: boolean;
    displaySize: WidgetSize;
    startResize: (
        e: React.PointerEvent<HTMLDivElement>,
        axis: 'x' | 'y' | 'both',
    ) => void;
    handleResizeMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    handleResizeUp: () => void;
}

function ResizeHandles({
    isResizing,
    displaySize,
    startResize,
    handleResizeMove,
    handleResizeUp,
}: ResizeHandlesProps) {
    const barCls = (horizontal: boolean) =>
        cn(
            horizontal ? 'h-0.75 w-8' : 'w-0.75 h-8',
            'rounded-full transition-colors',
            isResizing
                ? 'bg-blue-500 dark:bg-blue-400'
                : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-500 dark:hover:bg-zinc-400',
        );
    const labelCls =
        'absolute text-[10px] font-semibold uppercase tracking-widest text-white bg-blue-500 px-2 py-0.5 rounded-md shadow whitespace-nowrap pointer-events-none';
    return (
        <>
            <div
                className="absolute top-6 bottom-6 -right-1.5 w-4 flex items-center justify-center cursor-col-resize z-30 opacity-0 group-hover/widget:opacity-100 transition-opacity"
                data-no-drag
                onPointerDown={(e) => startResize(e, 'x')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
            >
                <div className={barCls(false)} />
                {isResizing && (
                    <span
                        className={cn(
                            labelCls,
                            '-top-7 left-1/2 -translate-x-1/2',
                        )}
                    >
                        {SIZE_LABELS[displaySize]}
                    </span>
                )}
            </div>
            <div
                className="absolute left-6 right-6 -bottom-1.5 h-4 flex items-center justify-center cursor-row-resize z-30 opacity-0 group-hover/widget:opacity-100 transition-opacity"
                data-no-drag
                onPointerDown={(e) => startResize(e, 'y')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
            >
                <div className={barCls(true)} />
                {isResizing && (
                    <span
                        className={cn(
                            labelCls,
                            '-left-7 top-1/2 -translate-y-1/2',
                        )}
                    >
                        {SIZE_LABELS[displaySize]}
                    </span>
                )}
            </div>
            <div
                className="absolute -bottom-1.5 -right-1.5 w-5 h-5 flex items-center justify-center cursor-nwse-resize z-30 opacity-0 group-hover/widget:opacity-100 transition-opacity"
                data-no-drag
                onPointerDown={(e) => startResize(e, 'both')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeUp}
                onPointerCancel={handleResizeUp}
            >
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-sm transition-colors',
                        isResizing
                            ? 'bg-blue-500 dark:bg-blue-400'
                            : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-500 dark:hover:bg-zinc-400',
                    )}
                />
                {isResizing && (
                    <span
                        className={cn(
                            labelCls,
                            '-top-7 left-1/2 -translate-x-1/2',
                        )}
                    >
                        {SIZE_LABELS[displaySize]}
                    </span>
                )}
            </div>
        </>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function WidgetWrapper({
    config,
    onToggleVisible,
    onRemove,
    onMoveToBucket,
    onUnpresent,
    children,
}: WidgetWrapperProps) {
    const prefersReducedMotion = useReducedMotion();
    const { reducedMotion } = useAccessibility();
    const skipMotion = prefersReducedMotion || reducedMotion;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: config.id });
    const { settings, updateSettings } = useWidgetSettings(
        config.id,
        config.type,
    );

    // Local committed size — immediately updated on resize, immune to context timing races.
    // Syncs with external changes (settings panel) via state-during-render to avoid cascading effects.
    const [committedSize, setCommittedSize] = useState<WidgetSize>(
        settings.size,
    );
    const [prevSettingsSize, setPrevSettingsSize] = useState<WidgetSize>(
        settings.size,
    );
    if (settings.size !== prevSettingsSize) {
        setPrevSettingsSize(settings.size);
        setCommittedSize(settings.size);
    }

    const {
        isResizing,
        displaySize,
        startResize,
        handleResizeMove,
        handleResizeUp,
    } = useWidgetResize(committedSize, setCommittedSize, updateSettings);
    const isViewportPinned = settings.pinMode === 'viewport';
    const isPinned = settings.pinMode !== 'none';

    return (
        <motion.div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                zIndex: isDragging ? 10 : undefined,
            }}
            {...attributes}
            {...(!isPinned ? listeners : {})}
            className={cn(
                sizeClasses[displaySize],
                'touch-none relative group/widget',
                isViewportPinned && 'sticky top-4 z-30',
                isResizing && 'select-none',
            )}
            layout={skipMotion ? false : !isDragging && !isResizing}
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 0.4 : 1 }}
            transition={
                skipMotion
                    ? { duration: 0 }
                    : {
                          layout: { duration: 0.2, ease: 'easeInOut' },
                          opacity: { duration: 0.25 },
                      }
            }
        >
            {config.type !== 'folder' && (
                <StatusDot
                    widgetId={config.id}
                    className="absolute top-3 right-3 z-20"
                />
            )}
            {config.type !== 'folder' && (
                <WidgetContextChip
                    widgetType={config.type}
                    className="absolute top-3 left-3 z-20"
                />
            )}
            <HideWidgetContext.Provider
                value={() => onToggleVisible(config.id)}
            >
                <RemoveWidgetContext.Provider
                    value={onRemove ? () => onRemove(config.id) : null}
                >
                    <BucketWidgetContext.Provider
                        value={
                            onMoveToBucket
                                ? () => onMoveToBucket(config.id)
                                : null
                        }
                    >
                        <UnpresentWidgetContext.Provider
                            value={
                                onUnpresent
                                    ? () => onUnpresent(config.id)
                                    : null
                            }
                        >
                            {children}
                        </UnpresentWidgetContext.Provider>
                    </BucketWidgetContext.Provider>
                </RemoveWidgetContext.Provider>
            </HideWidgetContext.Provider>
            <ResizeHandles
                isResizing={isResizing}
                displaySize={displaySize}
                startResize={startResize}
                handleResizeMove={handleResizeMove}
                handleResizeUp={handleResizeUp}
            />
        </motion.div>
    );
}
