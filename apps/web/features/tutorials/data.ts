import {
    Blocks,
    Cable,
    LayoutDashboard,
    LockKeyhole,
    PlugZap,
} from 'lucide-react';
import type {
    TutorialLesson,
    TutorialPlaybook,
    TutorialTrack,
} from './types/tutorials';

export const tutorialTracks: TutorialTrack[] = [
    {
        id: 'workspace',
        title: 'Workspace Basics',
        description:
            'Learn scenes, folders, free canvas, search, and the main dashboard model.',
        icon: LayoutDashboard,
        difficulty: 'starter',
        minutes: 18,
        lessons: 5,
        completion: 80,
    },
    {
        id: 'widgets',
        title: 'Widget Composition',
        description:
            'Customize, group, resize, hide, and combine widgets into reusable operating surfaces.',
        icon: Blocks,
        difficulty: 'intermediate',
        minutes: 26,
        lessons: 7,
        completion: 42,
    },
    {
        id: 'automations',
        title: 'Actions and Automations',
        description:
            'Review extracted actions, configure approvals, and stage recurring workflows.',
        icon: Cable,
        difficulty: 'advanced',
        minutes: 31,
        lessons: 6,
        completion: 25,
    },
    {
        id: 'privacy',
        title: 'Privacy and Permissions',
        description:
            'Control sensitive widgets, redaction, consent, inactivity behavior, and auditability.',
        icon: LockKeyhole,
        difficulty: 'starter',
        minutes: 16,
        lessons: 4,
        completion: 50,
    },
    {
        id: 'integrations',
        title: 'Connected Apps',
        description:
            'Wire Gmail, Calendar, Drive, finance feeds, Slack, Linear, and provider keys.',
        icon: PlugZap,
        difficulty: 'intermediate',
        minutes: 22,
        lessons: 5,
        completion: 10,
    },
];

export const tutorialLessons: TutorialLesson[] = [
    {
        id: 'lesson-command',
        trackId: 'workspace',
        title: 'Use search as your launcher',
        description:
            'Find widgets, pages, actions, settings, and workspace destinations from one command surface.',
        status: 'complete',
        minutes: 4,
        outcome: 'Open any major feature in under five seconds.',
        checklist: ['Open search', 'Find a widget', 'Jump to settings'],
    },
    {
        id: 'lesson-scenes',
        trackId: 'workspace',
        title: 'Create workspace scenes',
        description:
            'Save different dashboard layouts for research, recovery, finance, and deep work.',
        status: 'in-progress',
        minutes: 6,
        outcome: 'Switch contexts without rebuilding your dashboard.',
        checklist: ['Arrange widgets', 'Save a scene', 'Restore a scene'],
    },
    {
        id: 'lesson-folders',
        trackId: 'widgets',
        title: 'Group widgets into folders',
        description:
            'Use folders and the widget bucket to keep dense dashboards calm without losing access.',
        status: 'not-started',
        minutes: 5,
        outcome: 'Organize related tools into a compact workspace layer.',
        checklist: ['Create folder', 'Move widgets', 'Rename folder'],
    },
    {
        id: 'lesson-actions',
        trackId: 'automations',
        title: 'Approve extracted actions',
        description:
            'Review email and calendar suggestions before they become real tasks or events.',
        status: 'in-progress',
        minutes: 7,
        outcome: 'Use automation while preserving human control.',
        checklist: ['Review action', 'Inspect confidence', 'Approve draft'],
    },
    {
        id: 'lesson-redaction',
        trackId: 'privacy',
        title: 'Set low-profile display modes',
        description:
            'Hide or redact finance, recovery, health, and note content when the workspace is shared.',
        status: 'not-started',
        minutes: 4,
        outcome: 'Share screens without exposing sensitive details.',
        checklist: ['Pick sensitive widget', 'Enable blur', 'Test reveal'],
    },
    {
        id: 'lesson-drive',
        trackId: 'integrations',
        title: 'Connect document sources',
        description:
            'Use Google Drive and upload workflows to bring documents into Files, Reading, and View.',
        status: 'not-started',
        minutes: 6,
        outcome: 'Route documents into annotation and analysis surfaces.',
        checklist: ['Open integrations', 'Connect Drive', 'Browse files'],
    },
];

export const tutorialPlaybooks: TutorialPlaybook[] = [
    {
        id: 'playbook-first-dashboard',
        title: 'First dashboard in 20 minutes',
        description:
            'A guided path for building a practical daily workspace from widgets, scenes, and search.',
        recommendedFor: 'New users',
        steps: 8,
        enabled: true,
    },
    {
        id: 'playbook-automation-safe',
        title: 'Safe automation launch',
        description:
            'Configure approval gates, action queues, audit visibility, and rollback expectations.',
        recommendedFor: 'Power users',
        steps: 10,
        enabled: true,
    },
    {
        id: 'playbook-research-os',
        title: 'Research operating system',
        description:
            'Combine Reading, Knowledge, View, Journal, and uploaded documents into one loop.',
        recommendedFor: 'Researchers',
        steps: 9,
        enabled: false,
    },
];
