'use client';

import { motion } from 'framer-motion';
import { Link2, Link2Off, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { HideWidgetContext } from '@/features/dashboard/lib/HideWidgetContext';
import { RemoveWidgetContext } from '@/features/dashboard/lib/RemoveWidgetContext';
import { BucketWidgetContext } from '@/features/dashboard/lib/BucketWidgetContext';
import { UnpresentWidgetContext } from '@/features/dashboard/lib/UnpresentWidgetContext';
import { StatusDot } from '@/features/notifications/components/StatusDot';
import { FreeCanvasResizeHandles } from './FreeCanvasResizeHandles';
import { type Pos, type Size, INTERACTIVE } from './freeCanvasUtils';

interface GlueButtonProps {
    id: string;
    isGlued: boolean;
    isPendingGlueSource: boolean;
    onGlueToggle: (id: string) => void;
}

function GlueButton({
    id,
    isGlued,
    isPendingGlueSource,
    onGlueToggle,
}: GlueButtonProps) {
    return (
        <button
            data-no-drag
            onClick={(e) => {
                e.stopPropagation();
                onGlueToggle(id);
            }}
            title={
                isGlued
                    ? 'Unglue'
                    : isPendingGlueSource
                      ? 'Cancel glue'
                      : 'Glue to another widget'
            }
            className={cn(
                'absolute -top-2 -left-2 z-30 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm border',
                isGlued
                    ? 'opacity-100 bg-amber-400 border-amber-300 text-white'
                    : isPendingGlueSource
                      ? 'opacity-100 bg-blue-500 border-blue-400 text-white animate-pulse'
                      : 'opacity-0 group-hover/item:opacity-100 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600',
            )}
        >
            {isGlued ? <Link2Off size={9} /> : <Link2 size={9} />}
        </button>
    );
}

interface WeaveButtonProps {
    id: string;
    isWoven: boolean;
    isPendingWeaveSource: boolean;
    onWeaveToggle: (id: string) => void;
}

function WeaveButton({
    id,
    isWoven,
    isPendingWeaveSource,
    onWeaveToggle,
}: WeaveButtonProps) {
    return (
        <button
            data-no-drag
            onClick={(e) => {
                e.stopPropagation();
                onWeaveToggle(id);
            }}
            title={
                isWoven
                    ? 'Unweave'
                    : isPendingWeaveSource
                      ? 'Cancel weave'
                      : 'Weave with another widget'
            }
            className={cn(
                'absolute -bottom-2 -left-2 z-30 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm border',
                isWoven
                    ? 'opacity-100 bg-purple-500 border-purple-400 text-white'
                    : isPendingWeaveSource
                      ? 'opacity-100 bg-purple-500 border-purple-400 text-white animate-pulse'
                      : 'opacity-0 group-hover/item:opacity-100 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600',
            )}
        >
            <GitMerge size={9} />
        </button>
    );
}

export interface FreeItemProps {
    config: WidgetConfig;
    pos: Pos;
    size: Size;
    isDraggingThis: boolean;
    isResizingThis: boolean;
    isProximityHint: boolean;
    isCanvasPinned: boolean;
    isViewportPinned: boolean;
    isGlued: boolean;
    isPendingGlueSource: boolean;
    isPendingGlueTarget: boolean;
    isWoven: boolean;
    isPendingWeaveSource: boolean;
    isPendingWeaveTarget: boolean;
    onToggleVisible: (id: string) => void;
    onRemove: (id: string) => void;
    onMoveToBucket?: (id: string) => void;
    onUnpresent?: (id: string) => void;
    onDragDown: (id: string, e: React.PointerEvent<HTMLDivElement>) => void;
    onDragMove: (id: string, e: React.PointerEvent<HTMLDivElement>) => void;
    onDragUp: (id: string) => void;
    onResizeDown: (
        id: string,
        e: React.PointerEvent<HTMLDivElement>,
        axis: 'x' | 'y' | 'both',
    ) => void;
    onResizeMove: (id: string, e: React.PointerEvent<HTMLDivElement>) => void;
    onResizeUp: (id: string) => void;
    onGlueToggle: (id: string) => void;
    onGlueConnect: (id: string) => void;
    onWeaveToggle: (id: string) => void;
    onWeaveConnect: (id: string) => void;
    children: React.ReactNode;
}

export function FreeItem({
    config,
    pos,
    size,
    isDraggingThis,
    isResizingThis,
    isProximityHint,
    isCanvasPinned,
    isViewportPinned,
    isGlued,
    isPendingGlueSource,
    isPendingGlueTarget,
    isWoven,
    isPendingWeaveSource,
    isPendingWeaveTarget,
    onToggleVisible,
    onRemove,
    onMoveToBucket,
    onUnpresent,
    onDragDown,
    onDragMove,
    onDragUp,
    onResizeDown,
    onResizeMove,
    onResizeUp,
    onGlueToggle,
    onGlueConnect,
    onWeaveToggle,
    onWeaveConnect,
    children,
}: FreeItemProps) {
    const isPinned = isCanvasPinned || isViewportPinned;
    const hasPendingRelation = isPendingGlueTarget || isPendingWeaveTarget;
    return (
        <motion.div
            animate={{ scale: isDraggingThis ? 1.02 : 1 }}
            transition={{ duration: 0.12 }}
            style={{
                position: isViewportPinned ? 'fixed' : 'absolute',
                left: pos.x,
                top: pos.y,
                width: size.w,
                minHeight: size.h,
                zIndex: isDraggingThis ? 50 : isPinned ? 20 : 1,
            }}
            className={cn(
                'touch-none group/item group/freeitem',
                isDraggingThis && 'shadow-2xl',
                isResizingThis && 'select-none',
                isProximityHint &&
                    'ring-2 ring-blue-400/60 ring-offset-2 rounded-3xl',
                isViewportPinned && 'ring-2 ring-emerald-400/50 rounded-3xl',
                isPinned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
            )}
            onPointerDown={(e) => {
                if (isPinned) return;
                if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
                if (e.button !== 0 || !e.isPrimary) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                onDragDown(config.id, e);
            }}
            onPointerMove={(e) => onDragMove(config.id, e)}
            onPointerUp={() => onDragUp(config.id)}
        >
            {config.type !== 'folder' && (
                <StatusDot
                    widgetId={config.id}
                    className="absolute top-3 right-3 z-20"
                />
            )}
            <HideWidgetContext.Provider
                value={() => onToggleVisible(config.id)}
            >
                <RemoveWidgetContext.Provider value={() => onRemove(config.id)}>
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
            {isProximityHint && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-bold shadow-md whitespace-nowrap">
                        Group?
                    </span>
                </div>
            )}
            {hasPendingRelation && (
                <div
                    data-no-drag
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isPendingGlueTarget) onGlueConnect(config.id);
                        else onWeaveConnect(config.id);
                    }}
                    className={cn(
                        'absolute inset-0 rounded-3xl z-40 ring-2 ring-inset cursor-pointer transition-all',
                        isPendingGlueTarget
                            ? 'bg-blue-400/10 ring-blue-400 hover:bg-blue-400/20'
                            : 'bg-purple-400/10 ring-purple-400 hover:bg-purple-400/20',
                    )}
                />
            )}
            <GlueButton
                id={config.id}
                isGlued={isGlued}
                isPendingGlueSource={isPendingGlueSource}
                onGlueToggle={onGlueToggle}
            />
            <WeaveButton
                id={config.id}
                isWoven={isWoven}
                isPendingWeaveSource={isPendingWeaveSource}
                onWeaveToggle={onWeaveToggle}
            />
            <FreeCanvasResizeHandles
                id={config.id}
                isResizingThis={isResizingThis}
                onResizeDown={onResizeDown}
                onResizeMove={onResizeMove}
                onResizeUp={onResizeUp}
            />
        </motion.div>
    );
}
