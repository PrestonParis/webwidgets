'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { supabase } from '@/lib/db/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    profile: { full_name: string | null; role: string } | null;
    accessToken: string | null;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    session: null,
    status: 'loading',
    profile: null,
    accessToken: null,
    refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [status, setStatus] = useState<AuthContextValue['status']>('loading');
    const [profile, setProfile] = useState<{
        full_name: string | null;
        role: string;
    } | null>(null);

    // Load session once on mount
    useEffect(() => {
        let mounted = true;

        const loadSession = async () => {
            try {
                // getUser() verifies the token with the auth server (secure)
                const [{ data: { user }, error }, { data: { session } }] = await Promise.all([
                    supabase.auth.getUser(),
                    supabase.auth.getSession(),
                ]);
                if (error) throw error;

                if (mounted) {
                    setUser(user ?? null);
                    setSession(session);
                    setStatus(user ? 'authenticated' : 'unauthenticated');
                }
            } catch (error) {
                console.error('Error loading session:', error);
                if (mounted) {
                    setStatus('unauthenticated');
                }
            }
        };

        loadSession();

        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;
                
                setSession(session);
                setUser(session?.user ?? null);
                setStatus(session ? 'authenticated' : 'unauthenticated');
                
                if (event === 'SIGNED_OUT') {
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Load profile when user changes
    useEffect(() => {
        if (!user?.id) return;
        let mounted = true;

        const loadProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', user.id)
                    .single();
                
                if (error) throw error;
                
                if (mounted && data) {
                    setProfile(data);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };

        loadProfile();

        return () => {
            mounted = false;
        };
    }, [user?.id]);

    // Refresh session manually
    const refresh = useCallback(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.refreshSession();
            if (error) throw error;
            
            setSession(session);
            setUser(session?.user ?? null);
            setStatus(session ? 'authenticated' : 'unauthenticated');
        } catch (error) {
            console.error('Error refreshing session:', error);
        }
    }, []);

    const accessToken = session?.access_token ?? null;

    return (
        <AuthContext.Provider 
            value={{ 
                user, 
                session,
                status, 
                profile, 
                accessToken,
                refresh,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext(): AuthContextValue {
    return useContext(AuthContext);
}
