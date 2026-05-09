'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { WidgetWrapperProps } from '@/features/dashboard/types/dashboard';
import { WidgetSize } from '@/features/widgets/types/widgets';
import { cn } from '@/lib/utils/utils';
import { HideWidgetContext } from '@/features/dashboard/lib/HideWidgetContext';
import { StatusDot } from '@/features/notifications/components/StatusDot';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';

const sizeClasses: Record<WidgetSize, string> = {
    compact: 'col-span-1',
    default: 'col-span-1',
    large: 'col-span-2 row-span-2',
};

export default function WidgetWrapper({
    config,
    onToggleVisible,
    children,
}: WidgetWrapperProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: config.id });

    const { settings } = useWidgetSettings(config.id, config.type);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(sizeClasses[settings.size], 'touch-none relative')}
            layout={!isDragging}
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 0.4 : 1 }}
            transition={{
                layout: { duration: 0.2, ease: 'easeInOut' },
                opacity: { duration: 0.25 },
            }}
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
                {children}
            </HideWidgetContext.Provider>
        </motion.div>
    );
}
