'use client';

import { useAuthContext } from '@/features/auth/context/AuthContext';
import { supabase } from '@/lib/db/supabase';

async function signUpWithEmail(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
}

async function signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
}

// All Google OAuth flows request the same combined scope set so that
// whichever flow runs last doesn't clobber the other service's token.
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

async function connectCalendar() {
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: GOOGLE_SCOPES,
            queryParams: { access_type: 'offline', prompt: 'consent' },
        },
    });
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
