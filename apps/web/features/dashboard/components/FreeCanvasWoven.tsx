'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { FreeCanvasResizeHandles } from './FreeCanvasResizeHandles';
import {
    type Pos,
    type Size,
    INTERACTIVE,
    getWidgetEmoji,
    getWidgetLabel,
} from '@/features/dashboard/lib/freeCanvasUtils';

interface WovenTabBarProps {
    members: WidgetConfig[];
    activeId: string;
    groupId: string;
    onSetActiveId: (id: string) => void;
    onUnweave: (groupId: string) => void;
}

function WovenTabBar({
    members,
    activeId,
    groupId,
    onSetActiveId,
    onUnweave,
}: WovenTabBarProps) {
    return (
        <div
            data-no-drag
            className="flex items-center gap-1 mb-1.5 px-1 flex-wrap"
        >
            {members.map((m) => (
                <button
                    key={m.id}
                    onClick={() => onSetActiveId(m.id)}
                    className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all',
                        m.id === activeId
                            ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-sm ring-1 ring-purple-300 dark:ring-purple-700'
                            : 'bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-700',
                    )}
                >
                    <span>{getWidgetEmoji(m)}</span>
                    <span className="max-w-25 truncate">
                        {getWidgetLabel(m)}
                    </span>
                </button>
            ))}
            <button
                onClick={() => onUnweave(groupId)}
                title="Unweave — restore as separate widgets"
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
                <Scissors size={9} /> Split
            </button>
        </div>
    );
}

export interface WovenItemProps {
    groupId: string;
    members: WidgetConfig[];
    pos: Pos;
    size: Size;
    isDraggingThis: boolean;
    isResizingThis: boolean;
    isPendingWeaveTarget: boolean;
    isPendingGlueTarget: boolean;
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
    onUnweave: (groupId: string) => void;
    onGlueConnect: (id: string) => void;
    onWeaveConnect: (id: string) => void;
    renderContent: (config: WidgetConfig) => React.ReactNode;
}

export function WovenItem({
    groupId,
    members,
    pos,
    size,
    isDraggingThis,
    isResizingThis,
    isPendingWeaveTarget,
    isPendingGlueTarget,
    onDragDown,
    onDragMove,
    onDragUp,
    onResizeDown,
    onResizeMove,
    onResizeUp,
    onUnweave,
    onGlueConnect,
    onWeaveConnect,
    renderContent,
}: WovenItemProps) {
    const leader = members[0]!;
    const [activeId, setActiveId] = useState(leader.id);
    const activeMember = members.find((m) => m.id === activeId) ?? leader;
    const hasPendingRelation = isPendingGlueTarget || isPendingWeaveTarget;

    return (
        <motion.div
            animate={{ scale: isDraggingThis ? 1.02 : 1 }}
            transition={{ duration: 0.12 }}
            style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: size.w,
                zIndex: isDraggingThis ? 50 : 1,
            }}
            className={cn(
                'touch-none group/item',
                isDraggingThis && 'shadow-2xl',
                isResizingThis && 'select-none',
                'cursor-grab active:cursor-grabbing',
            )}
            onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
                if (e.button !== 0 || !e.isPrimary) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                onDragDown(leader.id, e);
            }}
            onPointerMove={(e) => onDragMove(leader.id, e)}
            onPointerUp={() => onDragUp(leader.id)}
        >
            <WovenTabBar
                members={members}
                activeId={activeId}
                groupId={groupId}
                onSetActiveId={setActiveId}
                onUnweave={onUnweave}
            />
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeId}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        {renderContent(activeMember)}
                    </motion.div>
                </AnimatePresence>
                <div className="absolute -left-1 top-4 bottom-4 w-0.5 rounded-full bg-purple-400/60 pointer-events-none" />
            </div>
            {hasPendingRelation && (
                <div
                    data-no-drag
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isPendingGlueTarget) onGlueConnect(leader.id);
                        else onWeaveConnect(leader.id);
                    }}
                    className={cn(
                        'absolute inset-0 rounded-3xl z-40 ring-2 ring-inset cursor-pointer transition-all',
                        isPendingGlueTarget
                            ? 'bg-blue-400/10 ring-blue-400 hover:bg-blue-400/20'
                            : 'bg-purple-400/10 ring-purple-400 hover:bg-purple-400/20',
                    )}
                />
            )}
            <FreeCanvasResizeHandles
                id={leader.id}
                isResizingThis={isResizingThis}
                onResizeDown={onResizeDown}
                onResizeMove={onResizeMove}
                onResizeUp={onResizeUp}
            />
        </motion.div>
    );
}
