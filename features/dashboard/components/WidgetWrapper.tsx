'use client';

// ─────────────────────────────────────────────
// components/Dashboard/WidgetWrapper.tsx
//
// Wraps each widget in a sortable DnD node and
// applies the correct grid col/row span based
// on the widget's persisted size setting.
// ─────────────────────────────────────────────

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';
import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { WidgetSize } from '@/features/widgets/types/widgets';
import { cn } from '@/lib/utils/utils';

interface Props {
    config: WidgetConfig;
    onToggleVisible: (id: string) => void;
    children: ReactNode;
    /** Provided by useWidgetSettings in the parent — avoids a second Supabase fetch */
    size?: WidgetSize;
}

const sizeClasses: Record<WidgetSize, string> = {
    compact: 'col-span-1',
    default: 'col-span-1',
    large: 'col-span-2 row-span-2',
};

export default function WidgetWrapper({
    config,
    children,
    size = 'default',
}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: config.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                sizeClasses[size],
                'touch-none', // prevents scroll-fighting on mobile during drag
            )}
        >
            {children}
        </div>
    );
}
