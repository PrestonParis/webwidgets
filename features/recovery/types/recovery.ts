export interface Tracker {
    id: string;
    addiction: string;
    start_time: string;
    created_at: string;
}

export interface SoberWidgetProps {
    tracker: Tracker;
    onReset: (id: string, newStart: string) => void;
}

export interface EmptyStateProps {
    onAddClick: () => void;
}

export interface AddTrackerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (addiction: string) => Promise<void>;
    existingTrackers: Tracker[];
}

export type DayStatus = 'clean' | 'relapse' | 'future' | 'before';

export interface RecoveryHeatmapProps {
    trackerId: string;
    startTime: string;
}

export interface PendingAction {
    type: 'reset' | 'delete';
    id: string;
}
