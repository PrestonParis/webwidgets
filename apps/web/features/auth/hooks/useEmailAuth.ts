import { useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { AUTH_ERRORS, AUTH_MODES } from '@/features/auth/constants';
import { UseEmailAuthProps } from '@/features/auth/types/auth';

export const useEmailAuth = () => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEmailAuth = async ({
        mode,
        email,
        password,
    }: UseEmailAuthProps) => {
        setError(null);
        setLoading(true);

        try {
            if (mode === AUTH_MODES.SIGN_UP) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setError(AUTH_ERRORS.EMAIL_CONFIRMATION);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                const requestedPath = new URLSearchParams(
                    window.location.search,
                ).get('next');
                const safeNext =
                    requestedPath?.startsWith('/') &&
                    !requestedPath.startsWith('//')
                        ? requestedPath
                        : '/';
                window.location.assign(safeNext);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : AUTH_ERRORS.GENERIC);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (email: string) => {
        if (!email) {
            setError(AUTH_ERRORS.PASSWORD_RESET_NEEDS_EMAIL);
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });
            if (error) throw error;
            setError(AUTH_ERRORS.PASSWORD_RESET_SENT);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : AUTH_ERRORS.GENERIC);
        } finally {
            setLoading(false);
        }
    };

    return {
        handleEmailAuth,
        handleForgotPassword,
        error,
        loading,
        setError,
    };
};
