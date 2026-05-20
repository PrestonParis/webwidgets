import type { OnboardingGoalId } from '@/features/onboarding/types/goals';
import type {
    WidgetBetaState,
    WidgetCategory,
    WidgetPermission,
} from '@/features/platform/types/widgetTypes';

export interface FeatureDefinition {
    id: string;
    name: string;
    route: string;
    category: WidgetCategory;
    goals: OnboardingGoalId[];
    betaState: WidgetBetaState;
    requiredIntegrations?: string[];
    requiredPermissions?: WidgetPermission[];
}
