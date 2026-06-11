import type { OnboardingGoalId } from '@/features/onboarding/types/goals';

export interface SmartLayerScenario {
    id: string;
    persona: string;
    goals: OnboardingGoalId[];
    permissions: string[];
    connectedServices: string[];
    widgets: string[];
    sampleEmails: string[];
    expectedRecommendations: string[];
    expectedDeniedActions: string[];
    expectedRequiredApprovals: string[];
}

export const SMART_LAYER_SCENARIOS: SmartLayerScenario[] = [
    {
        id: 'student-productivity',
        persona: 'Student productivity user',
        goals: ['personal-productivity', 'school'],
        permissions: [],
        connectedServices: ['google-calendar'],
        widgets: ['todo', 'calendar'],
        sampleEmails: [],
        expectedRecommendations: ['timekeeping'],
        expectedDeniedActions: ['calendar.create_event'],
        expectedRequiredApprovals: ['calendar.create_event'],
    },
    {
        id: 'recovery-focused',
        persona: 'Recovery-focused user',
        goals: ['health-fitness'],
        permissions: ['health/tracking data'],
        connectedServices: [],
        widgets: ['recovery', 'tracking-mood'],
        sampleEmails: [],
        expectedRecommendations: ['tracking'],
        expectedDeniedActions: [],
        expectedRequiredApprovals: [],
    },
    {
        id: 'finance-focused',
        persona: 'Finance-focused user',
        goals: ['finances'],
        permissions: ['finance data'],
        connectedServices: [],
        widgets: ['converter'],
        sampleEmails: [],
        expectedRecommendations: ['net-worth'],
        expectedDeniedActions: [],
        expectedRequiredApprovals: [],
    },
    {
        id: 'developer',
        persona: 'Developer user',
        goals: ['software-development'],
        permissions: [],
        connectedServices: ['github'],
        widgets: ['timekeeping'],
        sampleEmails: [],
        expectedRecommendations: ['developer'],
        expectedDeniedActions: ['automation.run'],
        expectedRequiredApprovals: ['automation.run'],
    },
    {
        id: 'writer-researcher',
        persona: 'Writer and researcher',
        goals: ['research'],
        permissions: [],
        connectedServices: ['obsidian'],
        widgets: ['texteditor'],
        sampleEmails: [],
        expectedRecommendations: ['research-queue'],
        expectedDeniedActions: [],
        expectedRequiredApprovals: [],
    },
    {
        id: 'busy-parent',
        persona: 'Busy parent and family planner',
        goals: ['personal-productivity'],
        permissions: [],
        connectedServices: ['google-calendar'],
        widgets: ['calendar', 'todo'],
        sampleEmails: [],
        expectedRecommendations: ['activity-feed'],
        expectedDeniedActions: [],
        expectedRequiredApprovals: ['calendar.create_event'],
    },
];
