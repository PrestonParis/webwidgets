'use client';

import {
    Activity,
    Apple,
    Bandage,
    BedDouble,
    Bike,
    Brain,
    ChartNoAxesColumn,
    ChartNoAxesCombined,
    CircleHelp,
    Dumbbell,
    FlaskConical,
    Grid3X3,
    HeartPulse,
    Leaf,
    ListTree,
    Microscope,
    NotebookPen,
    Pill,
    Shapes,
    Smile,
    Table2,
    Target,
    Thermometer,
    Timer,
    Utensils,
    Waves,
    Zap,
    type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
    Activity,
    Apple,
    Bandage,
    BedDouble,
    Bike,
    Brain,
    ChartNoAxesColumn,
    ChartNoAxesCombined,
    CircleHelp,
    Dumbbell,
    FlaskConical,
    Grid3X3,
    HeartPulse,
    Leaf,
    ListTree,
    Microscope,
    NotebookPen,
    Pill,
    Shapes,
    Smile,
    Table2,
    Target,
    Thermometer,
    Timer,
    Utensils,
    Waves,
    Zap,
};

// Legacy custom categories may still contain emoji in their persisted `emoji`
// field. They intentionally render as Shapes until those records are migrated.
export function TrackingIcon({
    name,
    className = 'h-4 w-4',
}: {
    name?: string | undefined;
    className?: string | undefined;
}) {
    const Icon = (name && ICONS[name]) || Shapes;
    return <Icon aria-hidden="true" className={className} />;
}
