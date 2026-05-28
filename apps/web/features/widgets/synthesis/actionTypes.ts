import type { WidgetPermission } from '@/features/platform/types/widgetTypes';

export interface ActionRegistryEntry {
    id: string;
    label: string;
    description: string;
    category: string;
    emoji: string;
    permissions: WidgetPermission[];
    requiresConfirmation: boolean;
    safe: boolean;
    destructiveLevel: 'safe' | 'warning' | 'critical';
    queueability: 'immediate' | 'optional' | 'required';
    provider: string;
    inputSchema: Record<string, string>;
    outputSchema: Record<string, string>;
    supportedContexts: string[];
}

export interface AutomationRegistryEntry {
    id: string;
    label: string;
    description: string;
    triggerType: 'schedule' | 'threshold' | 'event' | 'condition';
    configSchema: Record<string, string>;
    permissions: WidgetPermission[];
    safe: boolean;
}
