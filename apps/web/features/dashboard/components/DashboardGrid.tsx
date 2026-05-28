'use client';

import { useEffect, useMemo } from 'react';
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
import RecoveryFolderWidget from '@/features/recovery/components/RecoveryFolderWidget';
import { renderWidgetContent } from '@/features/dashboard/lib/renderWidgetContent';
import { useWidgetSettingsContext } from '@/features/widgets/context/WidgetSettingsContext';
import { CopyStyleContext } from '@/features/dashboard/lib/CopyStyleContext';
import { getWidgetMetadata } from '@/features/widgets/registry/widgetMetadata';
import { DASHBOARD_BOOTSTRAP_WIDGET_COUNT } from '@/features/dashboard/lib/dashboardSnapshotBootstrap';
import { ViewportWidgetMount } from './ViewportWidgetMount';
import { WidgetBodyBudgetProvider } from './WidgetBodyBudget';
import {
    getWidgetEmoji,
    getWidgetLabel,
} from '@/features/dashboard/lib/freeCanvasUtils';

const DENSE_WIDGET_THRESHOLD = 12;
const DENSE_WIDGET_BODY_BUDGET = 4;

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
        onOpenRecovery,
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
                w.visible && w.containerId === 'main' && w.unpresented !== true,
        )
        .sort((a, b) => a.order - b.order);
    const denseLayout = visible.length > DENSE_WIDGET_THRESHOLD;
    const nonFolderWidgetCount = visible.filter(
        (w) => w.type !== 'folder',
    ).length;

    useEffect(() => {
        if (!denseLayout || process.env.NODE_ENV === 'production') return;
        console.info('[dashboard] dense widget memory guard', {
            totalWidgets: visible.length,
            eagerWidgetBodies: Math.min(
                DASHBOARD_BOOTSTRAP_WIDGET_COUNT,
                nonFolderWidgetCount,
            ),
            deferredWidgetBodies: Math.max(
                0,
                nonFolderWidgetCount - DASHBOARD_BOOTSTRAP_WIDGET_COUNT,
            ),
            snapshotDisabled: true,
        });
    }, [denseLayout, nonFolderWidgetCount, visible.length]);

    return (
        <CopyStyleContext.Provider value={copyStyleMap}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) =>
                    handleGridDragEnd(
                        e,
                        visible,
                        layout,
                        onLayoutChange,
                        onDragComplete,
                    )
                }
            >
                <SortableContext
                    items={visible.map((w) => w.id)}
                    strategy={rectSortingStrategy}
                >
                    <WidgetBodyBudgetProvider
                        enabled={denseLayout}
                        maxActive={DENSE_WIDGET_BODY_BUDGET}
                    >
                        <div
                            className={`dashboard-grid grid gap-6 items-start ${oneDimensionalMode ? 'grid-cols-1' : 'grid-cols-3 xl:grid-cols-4'}`}
                        >
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
                                            onOpen={() =>
                                                onOpenFolder(config.id)
                                            }
                                            onRename={(n) =>
                                                onRenameFolder(config.id, n)
                                            }
                                            onDelete={() =>
                                                onDeleteFolder(config.id)
                                            }
                                        />
                                    ) : config.type === 'recovery-empty' ? (
                                        <RecoveryFolderWidget
                                            onOpen={() => onOpenRecovery?.()}
                                        />
                                    ) : (
                                        <ViewportWidgetMount
                                            widgetId={config.id}
                                            config={config}
                                            eager={
                                                index <
                                                DASHBOARD_BOOTSTRAP_WIDGET_COUNT
                                            }
                                            label={getWidgetLabel(config)}
                                            emoji={getWidgetEmoji(config)}
                                            render={() =>
                                                renderWidgetContent(
                                                    config,
                                                    onReset,
                                                )
                                            }
                                        />
                                    )}
                                </WidgetWrapper>
                            ))}
                        </div>
                    </WidgetBodyBudgetProvider>
                </SortableContext>
            </DndContext>
        </CopyStyleContext.Provider>
    );
}
