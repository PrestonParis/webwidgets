import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { WidgetConfig } from '@/types/dashboard';
import WidgetWrapper from './WidgetWrapper';
import JournalWidget from '@/components/Widgets/JournalWidget';
import EmailWidget from '@/components/Widgets/EmailWidget';
import SoberWidget from '@/components/Widgets/RecoveryWidget';
import UnitConverterWidget from '@/components/Widgets/UnitConvertWidget';
import EmptyRecovery from './EmptyRecovery';
import ChessWidget from '../Widgets/ChessWidget';

interface Props {
    layout: WidgetConfig[];
    onLayoutChange: (next: WidgetConfig[]) => void;
    onToggleVisible: (id: string) => void;
}

function renderWidgetContent(
    config: WidgetConfig,
    onReset: (id: string, newStart: string) => void,
) {
    switch (config.type) {
        case 'journal':
            return <JournalWidget />;
        case 'email':
            return <EmailWidget />;
        case 'recovery': {
            const tracker = config.props?.tracker;
            if (!tracker) return null; // guard — recovery widgets always have a tracker
            return <SoberWidget tracker={tracker} onReset={onReset} />;
        }
        case 'recovery-empty': {
            return <EmptyRecovery />;
        }
        case 'converter':
            return <UnitConverterWidget />;
        case 'chess':
            return <ChessWidget />;
        default:
            return null;
    }
}

interface DashboardGridProps extends Props {
    onReset: (id: string, newStart: string) => void;
}

export default function DashboardGrid({
    layout,
    onLayoutChange,
    onToggleVisible,
    onReset,
}: DashboardGridProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    );

    const visible = layout
        .filter((w) => {
            const isVisible = w.visible && w.containerId === 'main';
            // Check if Chess is accidentally hitting a guard clause
            if (w.type === 'recovery' && !w.props?.tracker) return false;
            return isVisible;
        })
        .sort((a, b) => a.order - b.order);

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = visible.findIndex((w) => w.id === active.id);
        const newIndex = visible.findIndex((w) => w.id === over.id);
        const reordered = arrayMove(visible, oldIndex, newIndex).map(
            (w, i) => ({
                ...w,
                order: i,
            }),
        );

        // Merge back into full layout (preserves hidden widgets)
        const reorderedIds = new Set(reordered.map((w) => w.id));
        const next = [
            ...reordered,
            ...layout.filter((w) => !reorderedIds.has(w.id)),
        ];
        onLayoutChange(next);
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={visible.map((w) => w.id)}
                strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visible.map((config) => (
                        <WidgetWrapper
                            key={config.id}
                            config={config}
                            onToggleVisible={onToggleVisible}
                        >
                            {renderWidgetContent(config, onReset)}
                        </WidgetWrapper>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
