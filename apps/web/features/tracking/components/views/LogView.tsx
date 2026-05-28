'use client';

import { useState } from 'react';
import { ViewModeSwitcher, type ViewMode } from '../ViewModeSwitcher';
import { TableView } from './TableView';
import { GraphView } from './GraphView';
import { HeatmapView } from './HeatmapView';
import { TimelineView } from './TimelineView';
import { StatsView } from './StatsView';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';

interface LogViewProps {
    entries: TrackingEntry[];
    category: string;
    onDelete: (id: string) => void;
    onEdit: (entry: TrackingEntry) => void;
    customDefs: CustomCategoryDef[];
}

export function LogView({
    entries,
    category,
    onDelete,
    onEdit,
    customDefs,
}: LogViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('timeline');
    const customDef = customDefs.find((d) => d.id === category);

    return (
        <div className="space-y-4">
            <ViewModeSwitcher active={viewMode} onChange={setViewMode} />
            {viewMode === 'table' && (
                <TableView
                    entries={entries}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    customDefs={customDefs}
                />
            )}
            {viewMode === 'graph' && (
                <GraphView
                    entries={entries}
                    category={category}
                    customDef={customDef}
                />
            )}
            {viewMode === 'heatmap' && (
                <HeatmapView
                    entries={entries}
                    category={category}
                    customDefs={customDefs}
                />
            )}
            {viewMode === 'timeline' && (
                <TimelineView
                    entries={entries}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    customDefs={customDefs}
                />
            )}
            {viewMode === 'stats' && (
                <StatsView
                    entries={entries}
                    category={category}
                    customDef={customDef}
                />
            )}
        </div>
    );
}
