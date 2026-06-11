import type { OnboardingGoalId } from '@/features/onboarding/types/goals';

export type IntegrationState =
    | 'unavailable'
    | 'coming-soon'
    | 'available'
    | 'beta'
    | 'connected'
    | 'error'
    | 'skipped';
export type AutomationSetupState =
    | 'disabled'
    | 'suggested'
    | 'enabled'
    | 'requires_connection'
    | 'requires_consent';

export interface IntegrationProvider {
    id: string;
    name: string;
    summary: string;
    outcomes: string[];
    state: IntegrationState;
    scopes: string[];
    goalHints: OnboardingGoalId[];
}

export interface AutomationDefinition {
    id: string;
    name: string;
    summary: string;
    goalHints: OnboardingGoalId[];
    requiresIntegration?: string;
    requiresConsent?: boolean;
}
