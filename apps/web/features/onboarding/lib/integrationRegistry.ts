import { supabase } from '@/lib/db/supabase';
import type {
    IntegrationProvider,
    IntegrationState,
} from '@/features/onboarding/types/integrations';

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
    {
        id: 'gmail',
        name: 'Gmail',
        summary: 'Email intelligence, inbox summaries, and action extraction.',
        state: 'available',
        scopes: ['gmail.readonly'],
        goalHints: [
            'productivity',
            'automation',
            'research',
            'personal-dashboard',
        ],
    },
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        summary:
            'Events, reminders, daily planning, and schedule-aware widgets.',
        state: 'available',
        scopes: ['calendar.events'],
        goalHints: [
            'productivity',
            'development',
            'learning',
            'personal-dashboard',
        ],
    },
    {
        id: 'github',
        name: 'GitHub',
        summary:
            'Repository activity, issues, pull requests, and developer workflows.',
        state: 'beta',
        scopes: ['repo activity'],
        goalHints: ['development', 'automation'],
    },
    {
        id: 'obsidian',
        name: 'Obsidian',
        summary:
            'Vault notes, research capture, and local knowledge workflows.',
        state: 'coming-soon',
        scopes: ['local vault'],
        goalHints: ['writing-knowledge', 'research', 'learning'],
    },
    {
        id: 'youtube',
        name: 'YouTube',
        summary:
            'Learning queues, research watchlists, and future content summaries.',
        state: 'coming-soon',
        scopes: ['watch metadata'],
        goalHints: ['research', 'learning', 'automation'],
    },
    {
        id: 'google-sheets',
        name: 'Google Sheets',
        summary:
            'Spreadsheet imports, exports, and lightweight workspace data sources.',
        state: 'coming-soon',
        scopes: ['sheets.readonly'],
        goalHints: ['finance', 'health-tracking', 'automation'],
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
