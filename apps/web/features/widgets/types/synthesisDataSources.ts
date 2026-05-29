import type { WidgetPermission } from '@/features/platform/types/widget';
import type { WidgetTransformationType } from './synthesisWidgets';

export interface DataSourceRegistryEntry {
    id: string;
    label: string;
    category: string;
    emoji: string;
    description: string;
    schema: Record<string, string>;
    permissions: WidgetPermission[];
    refreshable: boolean;
    cacheable: boolean;
    allowedTransformations: WidgetTransformationType[];
    freshness: 'realtime' | 'minutes' | 'hourly' | 'daily' | 'manual';
    refreshStrategy: 'push' | 'poll' | 'manual' | 'computed';
    providerCapabilities: string[];
    unavailableReason?: string | undefined;
}
