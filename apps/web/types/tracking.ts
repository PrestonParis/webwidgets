import type {
    BaseTrackingEntry,
    TrackingEntry,
} from '@/features/tracking/types/trackingEntries';
import type { CreateSupplementPayload } from '@/features/tracking/types/supplement';

export interface TrackingInsightsPanelProps {
    logs: Array<{ metric: string; value: number }>;
}

export interface SupplementsCategoryViewProps {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}

export interface SupplementDefFormProps {
    onSubmit: (payload: CreateSupplementPayload) => Promise<void>;
    onCancel: () => void;
}
