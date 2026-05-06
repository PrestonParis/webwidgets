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

    if (overItem.type === 'folder' && activeItem.type !== 'folder') {
        const widgetsInFolder = layout.filter((w) => w.containerId === over.id);
        const next = layout.map((w) =>
            w.id === active.id
                ? {
                      ...w,
                      containerId: over.id as string,
                      order: widgetsInFolder.length,
                  }
                : w,
        );
        onLayoutChange(next);
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
    } = props;
    const sensors = useSensors(
        useSensor(SmartPointerSensor, {
            activationConstraint: { distance: 6 },
        }),
    );

    const visible = layout
        .filter((w) => {
            if (!w.visible || w.containerId !== 'main') return false;
            if (w.type === 'recovery' && !w.props?.tracker) return false;
            return true;
        })
        .sort((a, b) => a.order - b.order);

    return (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visible.map((config) => {
                        if (config.type === 'folder') {
                            return (
                                <WidgetWrapper
                                    key={config.id}
                                    config={config}
                                    onToggleVisible={onToggleVisible}
                                >
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
                                </WidgetWrapper>
                            );
                        }
                        return (
                            <WidgetWrapper
                                key={config.id}
                                config={config}
                                onToggleVisible={onToggleVisible}
                            >
                                {renderWidgetContent(config, onReset)}
                            </WidgetWrapper>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}
