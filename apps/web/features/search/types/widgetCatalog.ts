import type { WidgetType } from '@/features/dashboard/types/dashboard';

export interface WidgetEntry {
    type: WidgetType;
    name: string;
    emoji: string;
    description: string;
    href: string;
    keywords: string[];
    adminOnly?: boolean;
    /** Hidden from search unless the viewer has entertainment beta access. */
    betaOnly?: boolean;
}
