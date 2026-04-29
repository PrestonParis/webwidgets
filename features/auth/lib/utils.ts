import { supabase } from '@/lib/db/supabase';

export const signUpWithEmail = async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
};

export const signInWithEmail = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const handlePostSignIn = () => {
    window.location.reload();
};
