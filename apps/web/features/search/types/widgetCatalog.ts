import type { WidgetType } from '@/features/dashboard/types/dashboard';
import type { V1ReleaseState } from '@/lib/product/v1FeaturePolicy';

export interface WidgetEntry {
    type: WidgetType;
    name: string;
    emoji: string;
    description: string;
    href: string;
    keywords: string[];
    betaState?: V1ReleaseState;
    adminOnly?: boolean;
}
