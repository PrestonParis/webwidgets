'use client';

import { ArrowLeft, FolderOpen, LogOut } from 'lucide-react';
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
import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { SmartPointerSensor } from '@/features/dashboard/lib/smartPointerSensor';
import WidgetWrapper from './WidgetWrapper';
import FolderWidget from './FolderWidget';
import HiddenWidgetsTray from './HiddenWidgetsTray';
import { renderWidgetContent } from '@/features/dashboard/lib/renderWidgetContent';

interface FolderSubScreenProps {
    folder: WidgetConfig;
    layout: WidgetConfig[];
    onBack: () => void;
    onOpenFolder: (id: string) => void;
    onLayoutChange: (next: WidgetConfig[]) => void;
    onRemoveFromFolder: (widgetId: string) => void;
    onRenameFolder: (id: string, name: string) => void;
    onDeleteFolder: (id: string) => void;
    onToggleVisible: (id: string) => void;
    onReset: (id: string, newStart: string) => void;
}

function handleFolderDragEnd(
    event: DragEndEvent,
    widgetsInFolder: WidgetConfig[],
    layout: WidgetConfig[],
    onLayoutChange: (next: WidgetConfig[]) => void,
) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = widgetsInFolder.findIndex((w) => w.id === active.id);
    const newIndex = widgetsInFolder.findIndex((w) => w.id === over.id);
    const reordered = arrayMove(widgetsInFolder, oldIndex, newIndex).map(
        (w, i) => ({ ...w, order: i }),
    );
    const reorderedIds = new Set(reordered.map((w) => w.id));
    onLayoutChange([
        ...reordered,
        ...layout.filter((w) => !reorderedIds.has(w.id)),
    ]);
}

function FolderGrid({
    widgetsInFolder,
    layout,
    onLayoutChange,
    onToggleVisible,
    onReset,
    onRemoveFromFolder,
    onOpenFolder,
    onRenameFolder,
    onDeleteFolder,
    sensors,
}: {
    widgetsInFolder: WidgetConfig[];
    layout: WidgetConfig[];
    onLayoutChange: (next: WidgetConfig[]) => void;
    onToggleVisible: (id: string) => void;
    onReset: (id: string, newStart: string) => void;
    onRemoveFromFolder: (widgetId: string) => void;
    onOpenFolder: (id: string) => void;
    onRenameFolder: (id: string, name: string) => void;
    onDeleteFolder: (id: string) => void;
    sensors: ReturnType<typeof useSensors>;
}) {
    if (widgetsInFolder.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                <FolderOpen size={48} className="mb-3 opacity-30" />
                <p className="text-sm">This folder is empty</p>
                <p className="text-xs mt-1 text-zinc-500">
                    Drag widgets onto the folder card to add them here
                </p>
            </div>
        );
    }
    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) =>
                handleFolderDragEnd(e, widgetsInFolder, layout, onLayoutChange)
            }
        >
            <SortableContext
                items={widgetsInFolder.map((w) => w.id)}
                strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
                    {widgetsInFolder.map((config) => (
                        <div key={config.id} className="relative group/fi">
                            <WidgetWrapper
                                config={config}
                                onToggleVisible={onToggleVisible}
                            >
                                {config.type === 'folder' ? (
                                    <FolderWidget
                                        folder={config}
                                        layout={layout}
                                        onOpen={() => onOpenFolder(config.id)}
                                        onRename={(name) =>
                                            onRenameFolder(config.id, name)
                                        }
                                        onDelete={() =>
                                            onDeleteFolder(config.id)
                                        }
                                    />
                                ) : (
                                    renderWidgetContent(config, onReset)
                                )}
                            </WidgetWrapper>
                            <button
                                onClick={() => onRemoveFromFolder(config.id)}
                                className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 opacity-0 group-hover/fi:opacity-100 transition-all"
                                title="Remove from folder"
                            >
                                <LogOut size={11} />
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export default function FolderSubScreen({
    folder,
    layout,
    onBack,
    onOpenFolder,
    onLayoutChange,
    onRemoveFromFolder,
    onRenameFolder,
    onDeleteFolder,
    onToggleVisible,
    onReset,
}: FolderSubScreenProps) {
    const sensors = useSensors(
        useSensor(SmartPointerSensor, {
            activationConstraint: { distance: 6 },
        }),
    );

    const widgetsInFolder = layout
        .filter((w) => w.containerId === folder.id && w.visible)
        .sort((a, b) => a.order - b.order);

    const hiddenInFolder = layout.filter(
        (w) => w.containerId === folder.id && !w.visible,
    );

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
                <div className="flex items-center gap-2">
                    <FolderOpen size={20} className="text-blue-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                        {folder.props?.folderName ?? 'Folder'}
                    </h2>
                    <span className="text-sm text-zinc-400">
                        {widgetsInFolder.length} widget
                        {widgetsInFolder.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <FolderGrid
                widgetsInFolder={widgetsInFolder}
                layout={layout}
                onLayoutChange={onLayoutChange}
                onToggleVisible={onToggleVisible}
                onReset={onReset}
                onRemoveFromFolder={onRemoveFromFolder}
                onOpenFolder={onOpenFolder}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                sensors={sensors}
            />

            <HiddenWidgetsTray
                hidden={hiddenInFolder}
                onRestore={onToggleVisible}
            />
        </div>
    );
}
