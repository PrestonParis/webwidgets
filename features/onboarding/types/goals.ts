export type OnboardingStepId =
    | 'workspace'
    | 'goals'
    | 'integrations'
    | 'generate';

export type OnboardingStatus =
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'skipped';

export type OnboardingGoalId =
    | 'productivity'
    | 'health-tracking'
    | 'recovery'
    | 'finance'
    | 'development'
    | 'writing-knowledge'
    | 'research'
    | 'automation'
    | 'learning'
    | 'personal-dashboard';

export interface GoalDefinition {
    id: OnboardingGoalId;
    label: string;
    summary: string;
    details: string;
}

export interface OnboardingStepDefinition {
    id: OnboardingStepId;
    label: string;
    eyebrow: string;
    title: string;
    description: string;
}
