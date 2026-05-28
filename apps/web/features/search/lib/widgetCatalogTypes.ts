import type { WidgetType } from '@/features/dashboard/types/dashboard';

export interface WidgetEntry {
    type: WidgetType;
    name: string;
    emoji: string;
    description: string;
    href: string;
    keywords: string[];
    adminOnly?: boolean;
}
