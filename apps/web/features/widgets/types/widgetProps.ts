import type { ReactNode } from 'react';
import type { WidgetColor, WidgetSettings } from './widgets';

export interface WidgetShellProps {
    icon: ReactNode;
    title: string;
    badge?: ReactNode;
    headerActionsSlot?: ReactNode;
    children: ReactNode;
    footerHref?: string;
    footerLabel?: string;
    footerSlot?: ReactNode;
    settingsSlot?: ReactNode;
    settings?: WidgetSettings;
    widgetId: string;
    widgetType: string;
    onSettingsChange?: (patch: Partial<WidgetSettings>) => void;
}

export interface WidgetHeaderProps {
    icon: React.ReactNode;
    title: string;
    badge: React.ReactNode;
    headerActionsSlot?: React.ReactNode;
    settings: WidgetSettings;
    settingsOpen: boolean;
    onToggleSettings?: () => void;
    onColorChange?: (color: WidgetColor) => void;
    onSettingsChange?: (patch: Partial<WidgetSettings>) => void;
    onRename?: (name: string) => void;
    showSettings: boolean;
}

export interface WidgetSettingsPanelProps {
    open: boolean;
    settings: WidgetSettings;
    onUpdate: (partial: Partial<WidgetSettings>) => void;
    settingsSlot?: React.ReactNode;
    widgetList?: { id: string; label: string }[];
    relationship?: import('@/features/dashboard/types/dashboard').RelationshipType;
    onRelationshipChange?: (
        r: import('@/features/dashboard/types/dashboard').RelationshipType,
    ) => void;
}

export interface WidgetFooterProps {
    href: string;
    label: string;
    settings: WidgetSettings;
}
