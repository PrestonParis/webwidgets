import type {
    WidgetAction,
    WidgetDefinition,
    WidgetPermission,
} from '@/features/platform/types/widget';
import type { OnboardingGoalId } from '@/features/onboarding/types/goals';

export interface AssemblyContext {
    goals: OnboardingGoalId[];
    selectedWidgetIds: string[];
    enabledFeatureIds: string[];
    connectedIntegrationIds: string[];
    grantedPermissions: WidgetPermission[];
    accountState: 'anonymous' | 'authenticated' | 'admin';
    density: 'compact' | 'comfortable' | 'expanded';
    showBeta: boolean;
}

export interface WidgetEligibility {
    widget: WidgetDefinition;
    eligible: boolean;
    visible: boolean;
    reasons: string[];
    availableActions: WidgetAction[];
}
