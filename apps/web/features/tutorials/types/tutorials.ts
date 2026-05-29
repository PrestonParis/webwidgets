import type { LucideIcon } from 'lucide-react';

export type TutorialTrackId =
    | 'workspace'
    | 'widgets'
    | 'automations'
    | 'privacy'
    | 'integrations';

export type TutorialDifficulty = 'starter' | 'intermediate' | 'advanced';
export type TutorialStatus = 'not-started' | 'in-progress' | 'complete';

export interface TutorialTrack {
    id: TutorialTrackId;
    title: string;
    description: string;
    icon: LucideIcon;
    difficulty: TutorialDifficulty;
    minutes: number;
    lessons: number;
    completion: number;
}

export interface TutorialLesson {
    id: string;
    trackId: TutorialTrackId;
    title: string;
    description: string;
    status: TutorialStatus;
    minutes: number;
    outcome: string;
    checklist: string[];
}

export interface TutorialPlaybook {
    id: string;
    title: string;
    description: string;
    recommendedFor: string;
    steps: number;
    enabled: boolean;
}

export interface TutorialFilters {
    query: string;
    track: TutorialTrackId | 'all';
    difficulty: TutorialDifficulty | 'all';
    status: TutorialStatus | 'all';
}
