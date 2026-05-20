import type {
    AiAssistanceLevel,
    WidgetDensity,
    WorkspaceStyle,
} from '@/features/onboarding/types/profile';

export interface UserPreferences {
    userId: string;
    defaultLayoutMode: 'grid' | 'free';
    widgetDensity: WidgetDensity;
    workspaceStyle: WorkspaceStyle;
    aiAssistanceLevel: AiAssistanceLevel;
    privacyMode: boolean;
    preferredCategories: string[];
    hiddenWidgetIds: string[];
    starterWorkspaceChoice?: string;
    notificationPreferences: Record<string, boolean>;
}
