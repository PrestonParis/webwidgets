import { supabase } from '@/lib/db/supabase';
import type {
    IntegrationProvider,
    IntegrationState,
} from '@/features/onboarding/types/integrations';

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
    {
        id: 'gmail',
        name: 'Gmail',
        summary: 'Turn your inbox into an action list.',
        outcomes: [
            'Turn emails into tasks automatically',
            'Detect deadlines and follow-ups',
            'Build daily inbox summaries',
            'View email and calendar together',
        ],
        state: 'available',
        scopes: ['gmail.readonly'],
        goalHints: ['work', 'personal-productivity', 'research', 'custom'],
    },
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        summary: 'Keep your schedule and tasks in one place.',
        outcomes: [
            "See today's events on your dashboard",
            'Get reminded before meetings start',
            'Plan your week from a single view',
            'Sync deadlines with your task list',
        ],
        state: 'available',
        scopes: ['calendar.events'],
        goalHints: [
            'work',
            'school',
            'software-development',
            'personal-productivity',
        ],
    },
    {
        id: 'github',
        name: 'GitHub',
        summary: 'Keep your code and work in sync.',
        outcomes: [
            'See open PRs and issues at a glance',
            'Track repo activity without leaving the dashboard',
            'Surface stale branches and reviews',
            'Connect commits to your task list',
        ],
        state: 'beta',
        scopes: ['repo activity'],
        goalHints: ['software-development'],
    },
    {
        id: 'obsidian',
        name: 'Obsidian',
        summary: 'Bring your notes into the dashboard.',
        outcomes: [
            'Surface recent vault notes on your dashboard',
            'Capture ideas directly into your vault',
            'Link notes to tasks and research',
        ],
        state: 'coming-soon',
        scopes: ['local vault'],
        goalHints: ['research', 'school', 'personal-productivity'],
    },
    {
        id: 'google-drive',
        name: 'Google Drive',
        summary: 'Access your files without switching tabs.',
        outcomes: [
            'Open and work on Drive files inside webwidgets',
            'Attach documents to tasks and notes',
            'Search across files alongside your other content',
        ],
        state: 'coming-soon',
        scopes: ['drive.readonly'],
        goalHints: ['work', 'school', 'research'],
    },
];

export interface IntegrationRuntimeState {
    provider: IntegrationProvider;
    state: IntegrationState;
}

export function applyConnectionState(
    providerId: string,
    connectedIds: string[],
) {
    return connectedIds.includes(providerId) ? 'connected' : undefined;
}

export async function connectAvailableProvider(providerId: string) {
    if (providerId === 'gmail') {
        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/gmail.readonly',
                queryParams: { access_type: 'offline', prompt: 'consent' },
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    if (providerId === 'google-calendar') {
        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: [
                    'https://www.googleapis.com/auth/gmail.readonly',
                    'https://www.googleapis.com/auth/calendar.events',
                ].join(' '),
                queryParams: { access_type: 'offline', prompt: 'consent' },
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    if (providerId === 'google-drive') {
        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: [
                    'https://www.googleapis.com/auth/gmail.readonly',
                    'https://www.googleapis.com/auth/calendar.events',
                    'https://www.googleapis.com/auth/drive.readonly',
                ].join(' '),
                queryParams: { access_type: 'offline', prompt: 'consent' },
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    return { data: null, error: null };
}
