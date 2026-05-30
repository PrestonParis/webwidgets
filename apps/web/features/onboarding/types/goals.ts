export type OnboardingStepId =
    | 'welcome'
    | 'focus'
    | 'integrations'
    | 'recommendation'
    | 'launch';

export type OnboardingStatus =
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'skipped';

export type OnboardingGoalId =
    | 'school'
    | 'work'
    | 'software-development'
    | 'personal-productivity'
    | 'health-fitness'
    | 'finances'
    | 'research'
    | 'custom';

export type FocusAreaId =
    | 'email'
    | 'calendar'
    | 'tasks'
    | 'notes'
    | 'documents'
    | 'research-queue'
    | 'habits'
    | 'health'
    | 'finance'
    | 'collaboration';

export interface GoalDefinition {
    id: OnboardingGoalId;
    label: string;
    emoji: string;
    summary: string;
}

export interface FocusAreaDefinition {
    id: FocusAreaId;
    label: string;
    emoji: string;
}

export interface OnboardingStepDefinition {
    id: OnboardingStepId;
    label: string;
    eyebrow: string;
    title: string;
    description: string;
}
