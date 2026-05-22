import type { WidgetType } from '@/features/dashboard/types/dashboard';
import type {
    OnboardingGoalId,
    OnboardingStatus,
    OnboardingStepId,
} from '@/features/onboarding/types/goals';

export type WorkspaceStyle = 'calm' | 'technical' | 'editorial' | 'focused';
export type WidgetDensity = 'compact' | 'comfortable' | 'expanded';
export type OnboardingComplexity = 'guided' | 'balanced' | 'advanced';
export type AiAssistanceLevel = 'minimal' | 'balanced' | 'proactive';

export interface OnboardingPreferences {
    workspaceStyle: WorkspaceStyle;
    layoutMode: 'grid' | 'free';
    density: WidgetDensity;
    complexity: OnboardingComplexity;
    aiAssistance: AiAssistanceLevel;
}

export interface GeneratedWorkspace {
    widgetIds: string[];
    bucketWidgetIds: string[];
    scenes: string[];
    trackingSetup: string[];
    automationIds: string[];
}

export interface OnboardingProfile {
    version: 1;
    status: OnboardingStatus;
    currentStep: OnboardingStepId;
    completed: boolean;
    goals: OnboardingGoalId[];
    intent: string;
    selectedWidgetTypes: WidgetType[];
    enabledIntegrationIds: string[];
    skippedIntegrationIds: string[];
    enabledAutomationIds: string[];
    preferences: OnboardingPreferences;
    generatedWorkspace: GeneratedWorkspace | null;
    updatedAt: string;
}
