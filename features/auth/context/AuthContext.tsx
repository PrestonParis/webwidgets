'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { supabase } from '@/lib/db/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
    user: User | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    profile: { full_name: string | null; role: string } | null;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    status: 'loading',
    profile: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<AuthContextValue['status']>('loading');
    const [profile, setProfile] = useState<{
        full_name: string | null;
        role: string;
    } | null>(null);

    useEffect(() => {
        // Bootstrap: restore existing session immediately so first render is
        // authenticated rather than waiting for the listener to fire.
        void supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setStatus(session ? 'authenticated' : 'unauthenticated');
        });

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
                .select('full_name, role')
                .eq('id', user.id)
                .single();
            if (active && data) setProfile(data);
        })();
        return () => {
            active = false;
        };
    }, [user?.id]);

    return (
        <AuthContext.Provider value={{ user, status, profile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext(): AuthContextValue {
    return useContext(AuthContext);
}
