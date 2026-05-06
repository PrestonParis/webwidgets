'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<
        'loading' | 'authenticated' | 'unauthenticated'
    >('loading');

    const [profile, setProfile] = useState<{
        full_name: string | null;
    } | null>(null);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;

            setUser(currentUser);
            setStatus(session ? 'authenticated' : 'unauthenticated');

            if (event === 'SIGNED_OUT') {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user?.id) return;

        let active = true;

        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (active && data) setProfile(data);
        };

        void fetchProfile();

        return () => {
            active = false;
        };
    }, [user?.id]);

    // EMAIL AUTH (moved from utils.ts)
    const signUpWithEmail = async (email: string, password: string) => {
        return supabase.auth.signUp({ email, password });
    };

    const signInWithEmail = async (email: string, password: string) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signInWithGoogle = async () => {
        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                scopes: 'https://www.googleapis.com/auth/gmail.readonly',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    };

    const signOut = async () => {
        return supabase.auth.signOut();
    };

    return {
        user,
        status,
        loading: status === 'loading',
        profile,
        firstName: profile?.full_name?.split(' ')[0] ?? null,
        userId: user?.id,

        // actions
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
    };
}
