'use client';

import { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    arrayMove,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tracker } from '@/features/recovery/types/recovery';
import { SmartPointerSensor } from '@/features/dashboard/lib/smartPointerSensor';
import TrackerCard from './TrackerCard';

const ORDER_KEY = 'recovery_tracker_order';

function loadOrder(): string[] {
    try {
        return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]') as string[];
    } catch {
        return [];
    }
}

function applyOrder(trackers: Tracker[], order: string[]): Tracker[] {
    if (order.length === 0) return trackers;
    const map = new Map(trackers.map((t) => [t.id, t]));
    const ordered = order
        .map((id) => map.get(id))
        .filter((t): t is Tracker => !!t);
    const extra = trackers.filter((t) => !order.includes(t.id));
    return [...ordered, ...extra];
}

function SortableTrackerItem({
    tracker,
    onReset,
    onUpdateStart,
    onRequestDelete,
}: {
    tracker: Tracker;
    onReset: (id: string) => void;
    onUpdateStart: (id: string, start: string) => void;
    onRequestDelete: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tracker.id });

    return (
        <div
            ref={setNodeRef}
            id={tracker.id}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="relative scroll-mt-8"
        >
            <motion.div
                animate={{ opacity: isDragging ? 0.4 : 1 }}
                transition={{ duration: 0.15 }}
            >
                <div
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    className="flex justify-center items-center h-5 mb-1 cursor-grab active:cursor-grabbing text-gray-300 dark:text-zinc-700 hover:text-gray-500 dark:hover:text-zinc-400 transition-colors touch-none select-none rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/60"
                    aria-label="Drag to reorder"
                >
                    <GripHorizontal className="w-4 h-4" />
                </div>
                <TrackerCard
                    tracker={tracker}
                    onReset={onReset}
                    onUpdateStart={onUpdateStart}
                />
                <button
                    onClick={onRequestDelete}
                    className="absolute top-9 right-4 text-[10px] text-gray-300 dark:text-zinc-700 hover:text-red-400 transition-colors"
                >
                    delete
                </button>
            </motion.div>
        </div>
    );
}

export default function TrackerGrid({
    trackers,
    onReset,
    onUpdateStart,
    onRequestDelete,
}: {
    trackers: Tracker[];
    onReset: (id: string) => void;
    onUpdateStart: (id: string, start: string) => void;
    onRequestDelete: (id: string) => void;
}) {
    const [order, setOrder] = useState<string[]>(() => loadOrder());
    const sensors = useSensors(
        useSensor(SmartPointerSensor, {
            activationConstraint: { distance: 6 },
        }),
    );
    const sorted = applyOrder(trackers, order);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const ids = sorted.map((t) => t.id);
            const next = arrayMove(
                ids,
                ids.indexOf(active.id as string),
                ids.indexOf(over.id as string),
            );
            setOrder(next);
            localStorage.setItem(ORDER_KEY, JSON.stringify(next));
        },
        [sorted],
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={sorted.map((t) => t.id)}
                strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    <AnimatePresence mode="popLayout">
                        {sorted.map((tracker) => (
                            <motion.div
                                key={tracker.id}
                                layout
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                                <SortableTrackerItem
                                    tracker={tracker}
                                    onReset={onReset}
                                    onUpdateStart={onUpdateStart}
                                    onRequestDelete={() =>
                                        onRequestDelete(tracker.id)
                                    }
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </SortableContext>
        </DndContext>
    );
}
