import { useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
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
import { WIDGET_CATALOG } from '@/features/search/lib/widgetCatalog';

function handleGridDragEnd(
    event: DragEndEvent,
    visible: WidgetConfig[],
    layout: WidgetConfig[],
    onLayoutChange: (next: WidgetConfig[]) => void,
) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeItem = visible.find((w) => w.id === active.id);
    const overItem = visible.find((w) => w.id === over.id);
    if (!activeItem || !overItem) return;
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
            const entry = WIDGET_CATALOG.find((c) => c.type === w.type);
            const label =
                w.type === 'folder'
                    ? `${w.props?.folderName ?? 'Folder'} Folder`
                    : (entry?.name ?? w.type);
            map.set(w.id, {
                label,
                widgetType: w.type,
                settings: ctx.getSettings(w.id, w.type),
            });
        }
        return map;
    }, [layout, ctx]);

    const sensors = useSensors(
        useSensor(SmartPointerSensor, {
            activationConstraint: { distance: 6 },
        }),
    );
    function handleRemove(id: string) {
        onLayoutChange(layout.filter((w) => w.id !== id));
    }
    const visible = layout
        .filter(
            (w) =>
                w.visible &&
                w.containerId === 'main' &&
                !(w.type === 'recovery' && !w.props?.tracker),
        )
        .sort((a, b) => a.order - b.order);

    return (
        <CopyStyleContext.Provider value={copyStyleMap}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) =>
                    handleGridDragEnd(e, visible, layout, onLayoutChange)
                }
            >
                <SortableContext
                    items={visible.map((w) => w.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                        {visible.map((config) => (
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
                                ) : (
                                    renderWidgetContent(config, onReset)
                                )}
                            </WidgetWrapper>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </CopyStyleContext.Provider>
    );
}
