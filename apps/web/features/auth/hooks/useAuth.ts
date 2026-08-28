'use client';

import { useAuthContext } from '@/features/auth/components/AuthContext';
import { supabase } from '@/lib/db/supabase';
import { startGoogleConnection } from '@/lib/auth/googleConnection';

async function signUpWithEmail(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
}

async function signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
}

const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events',
].join(' ');

async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: GOOGLE_SCOPES,
            queryParams: { access_type: 'offline', prompt: 'consent' },
        },
    });
}

function connectCalendar() {
    startGoogleConnection('calendar');
}

async function signOut() {
    return supabase.auth.signOut();
}

export function useAuth() {
    const { user, status, profile } = useAuthContext();

    const isAdmin = profile?.role === 'admin';

    return {
        user,
        status,
        loading: status === 'loading',
        isAdmin,
        profile,
        firstName:
            profile?.full_name?.split(' ')[0] ??
            (user?.user_metadata?.full_name as string | undefined)?.split(
                ' ',
            )[0] ??
            null,
        userId: user?.id,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        connectCalendar,
        signOut,
    };
}
