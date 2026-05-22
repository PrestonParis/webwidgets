'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { useAccessibility } from '@/features/accessibility/context/AccessibilityContext';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
    DashboardGridProps,
    WidgetConfig,
} from '@/features/dashboard/types/dashboard';
import { SmartPointerSensor } from '@/features/dashboard/lib/smartPointerSensor';
import WidgetWrapper from './WidgetWrapper';
import FolderWidget from './FolderWidget';
import { renderWidgetContent } from '@/features/dashboard/lib/renderWidgetContent';
import { useWidgetSettingsContext } from '@/features/widgets/context/WidgetSettingsContext';
import { CopyStyleContext } from '@/features/dashboard/lib/CopyStyleContext';
import { getWidgetMetadata } from '@/features/widgets/registry/widgetMetadata';
import { WidgetSkeleton } from '@/features/widgets/components/WidgetSkeleton';
import { DASHBOARD_BOOTSTRAP_WIDGET_COUNT } from '@/features/dashboard/lib/dashboardSnapshotBootstrap';

function LazyWidgetMount({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (mounted) return;
        const node = ref.current;
        if (!node || !('IntersectionObserver' in window)) {
            setMounted(true);
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setMounted(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '600px 0px' },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [mounted]);

    return (
        <div ref={ref}>
            {mounted ? children : <WidgetSkeleton />}
        </div>
    );
}

function handleGridDragEnd(
    event: DragEndEvent,
    visible: WidgetConfig[],
    layout: WidgetConfig[],
    onLayoutChange: (next: WidgetConfig[]) => void,
    onDragComplete?: () => void,
) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeItem = visible.find((w) => w.id === active.id);
    const overItem = visible.find((w) => w.id === over.id);
    if (!activeItem || !overItem) return;
    onDragComplete?.();
    if (overItem.type === 'folder' && activeItem.id !== overItem.id) {
        const widgetsInFolder = layout.filter((w) => w.containerId === over.id);
        onLayoutChange(
            layout.map((w) =>
                w.id === active.id
                    ? {
                          ...w,
                          containerId: over.id as string,
                          order: widgetsInFolder.length,
                      }
                    : w,
            ),
        );
        return;
    }
    const oldIndex = visible.findIndex((w) => w.id === active.id);
    const newIndex = visible.findIndex((w) => w.id === over.id);
    const reordered = arrayMove(visible, oldIndex, newIndex).map((w, i) => ({
        ...w,
        order: i,
    }));
    const reorderedIds = new Set(reordered.map((w) => w.id));
    onLayoutChange([
        ...reordered,
        ...layout.filter((w) => !reorderedIds.has(w.id)),
    ]);
}

export default function DashboardGrid(props: DashboardGridProps) {
    const {
        layout,
        onLayoutChange,
        onDragComplete,
        onToggleVisible,
        onReset,
        onOpenFolder,
        onRenameFolder,
        onDeleteFolder,
        onMoveToBucket,
        onUnpresent,
    } = props;
    const ctx = useWidgetSettingsContext();

    const copyStyleMap = useMemo(() => {
        const map = new Map<
            string,
            {
                label: string;
                widgetType: string;
                settings: ReturnType<NonNullable<typeof ctx>['getSettings']>;
            }
        >();
        if (!ctx) return map;
        for (const w of layout) {
            if (w.containerId !== 'main') continue;
            const label =
                w.type === 'folder'
                    ? `${w.props?.folderName ?? 'Folder'} Folder`
                    : getWidgetMetadata(w.type).label;
            map.set(w.id, {
                label,
                widgetType: w.type,
                settings: ctx.getSettings(w.id, w.type),
            });
        }
        return map;
    }, [layout, ctx]);

    const { oneDimensionalMode } = useAccessibility();

    const activeSensors = useSensors(
        useSensor(SmartPointerSensor, {
            activationConstraint: { distance: 6 },
        }),
    );
    const noSensors = useSensors();
    const sensors = oneDimensionalMode ? noSensors : activeSensors;
    function handleRemove(id: string) {
        onLayoutChange(layout.filter((w) => w.id !== id));
    }
    const visible = layout
        .filter(
            (w) =>
                w.visible &&
                w.containerId === 'main' &&
                w.unpresented !== true,
        )
        .sort((a, b) => a.order - b.order);

    return (
        <CopyStyleContext.Provider value={copyStyleMap}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) =>
                    handleGridDragEnd(e, visible, layout, onLayoutChange, onDragComplete)
                }
            >
                <SortableContext
                    items={visible.map((w) => w.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className={`dashboard-grid grid gap-6 items-start ${oneDimensionalMode ? 'grid-cols-1' : 'grid-cols-3 xl:grid-cols-4'}`}>
                        {visible.map((config, index) => (
                            <WidgetWrapper
                                key={config.id}
                                config={config}
                                onToggleVisible={onToggleVisible}
                                onRemove={handleRemove}
                                {...(onMoveToBucket && { onMoveToBucket })}
                                {...(onUnpresent && { onUnpresent })}
                            >
                                {config.type === 'folder' ? (
                                    <FolderWidget
                                        folder={config}
                                        layout={layout}
                                        onOpen={() => onOpenFolder(config.id)}
                                        onRename={(n) =>
                                            onRenameFolder(config.id, n)
                                        }
                                        onDelete={() =>
                                            onDeleteFolder(config.id)
                                        }
                                    />
                                ) : index < DASHBOARD_BOOTSTRAP_WIDGET_COUNT ? (
                                    renderWidgetContent(config, onReset)
                                ) : (
                                    <LazyWidgetMount>
                                        {renderWidgetContent(config, onReset)}
                                    </LazyWidgetMount>
                                )}
                            </WidgetWrapper>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </CopyStyleContext.Provider>
    );
}
