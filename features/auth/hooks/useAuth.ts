'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { User } from '@supabase/supabase-js';

async function signUpWithEmail(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
}

async function signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
}

async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: 'https://www.googleapis.com/auth/gmail.readonly',
            queryParams: { access_type: 'offline', prompt: 'consent' },
        },
    });
}

async function connectCalendar() {
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/calendar.events',
            ].join(' '),
            queryParams: { access_type: 'offline', prompt: 'consent' },
        },
    });
}

async function signOut() {
    return supabase.auth.signOut();
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<
        'loading' | 'authenticated' | 'unauthenticated'
    >('loading');
    const [profile, setProfile] = useState<{ full_name: string | null } | null>(
        null,
    );

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setStatus(session ? 'authenticated' : 'unauthenticated');
            if (event === 'SIGNED_OUT') setProfile(null);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        let active = true;
        void (async () => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();
            if (active && data) setProfile(data);
        })();
        return () => {
            active = false;
        };
    }, [user?.id]);

    return {
        user,
        status,
        loading: status === 'loading',
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
