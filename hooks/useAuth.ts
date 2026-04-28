'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<
        'loading' | 'authenticated' | 'unauthenticated'
    >('loading');
    const [profile, setProfile] = useState<{ full_name: string | null } | null>(
        null,
    );

    useEffect(() => {
        // Get initial user (getUser validates the token with the auth server)
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user ?? null);
            setStatus(data.user ? 'authenticated' : 'unauthenticated');
        });

        // Listen for auth changes (sign in, sign out, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);
            setStatus(session ? 'authenticated' : 'unauthenticated');
            // Store Google tokens when signing in
            if (event === 'SIGNED_IN' && session?.provider_token) {
                await supabase.from('user_tokens').upsert(
                    {
                        user_id: session.user.id,
                        access_token: session.provider_token,
                        refresh_token: session.provider_refresh_token ?? null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' },
                );
            }
        });
        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
    }, []);

    // Fetch user profile (full name) after authentication
    useEffect(() => {
        if (!user?.id) return;
        supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                setProfile(data);
            });
    }, [user?.id]);

    // Sign in with Google, requesting offline access for refresh tokens
    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
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
    // Sign out user and clear session
    const signOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };
    // Return auth state and helper functions
    return {
        user,
        status,
        loading: status === 'loading',
        signInWithGoogle,
        signOut,
        firstName: profile?.full_name?.split(' ')[0] ?? 'User',
        userId: user?.id,
    };
}
