'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BackgroundGrid } from './BackgroundGrid';
import { RadialGlow } from '@/features/ui/components/RadialGlow';
import { LogoWordmark } from '@/features/ui/components/LogoWordmark';
import { AuthCard } from './AuthCard';

export default function ResetPasswordPage() {
    const router = useRouter();
    const { status } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => router.replace('/'), 1500);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Something went wrong.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 relative overflow-hidden">
            <BackgroundGrid />
            <RadialGlow />

            <div className="relative z-10 w-full max-w-sm">
                <LogoWordmark />

                <AuthCard>
                    {status === 'loading' ? (
                        <p className="text-center text-sm text-zinc-500">
                            Loading…
                        </p>
                    ) : status !== 'authenticated' ? (
                        <div className="text-center space-y-3">
                            <p className="text-sm text-zinc-400">
                                This password reset link is invalid or has
                                expired.
                            </p>
                            <Link
                                href="/"
                                className="inline-block text-sm text-[#4f6ef7] hover:text-[#7b93f9] transition-colors"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    ) : success ? (
                        <p className="text-center text-sm text-emerald-400">
                            Password updated. Redirecting…
                        </p>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                void onSubmit(e);
                            }}
                            className="space-y-3"
                        >
                            <input
                                type="password"
                                placeholder="New password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoFocus
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#4f6ef7]/60 focus:bg-white/8 transition-all"
                            />
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#4f6ef7]/60 transition-all"
                            />

                            {error && (
                                <p className="text-xs px-1 text-red-400">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-xl bg-[#4f6ef7] hover:bg-[#3d5ce0] text-white text-sm font-medium transition-all duration-150 disabled:opacity-50"
                            >
                                {loading ? '...' : 'Update password'}
                            </button>
                        </form>
                    )}
                </AuthCard>
            </div>
        </div>
    );
}
