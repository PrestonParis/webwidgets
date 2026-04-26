// This component provides a sign-in and sign-up interface using Supabase for authentication.
import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { WebWidgetsIcon } from '../Icons/WebWidgetsIcon';
import { GoogleIcon } from '../Icons/GoogleIcon';

export default function SignInPage() {
    const { signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setError('Check your email for a confirmation link.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Next-auth session will pick up after Google OAuth;
                window.location.reload();
            }
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
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            {/* Radial glow */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150px rounded-full opacity-10 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle, #4f6ef7 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 w-full max-w-sm">
                {/* Logo / wordmark */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#4f6ef7] flex items-center justify-center">
                            <WebWidgetsIcon />
                        </div>
                        <span className="text-white font-semibold text-lg tracking-tight">
                            Welcome to WebWidgets
                        </span>
                    </div>
                    <p className="text-zinc-500 text-sm">
                        Your personal dashboard. Sign in to continue.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#111118] border border-white/8 rounded-2xl p-7 shadow-2xl">
                    {/* Google */}
                    <button
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-150 mb-5"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-white/[0.07]" />
                        <span className="text-zinc-600 text-xs">or</span>
                        <div className="flex-1 h-px bg-white/[0.07]" />
                    </div>

                    {/* Email / Password form */}
                    <form onSubmit={handleEmailAuth} className="space-y-3">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#4f6ef7]/60 focus:bg-white/8 transition-all"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#4f6ef7]/60 transition-all"
                        />

                        {error && (
                            <p
                                className={`text-xs px-1 ${error.includes('Check your email') ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl bg-[#4f6ef7] hover:bg-[#3d5ce0] text-white text-sm font-medium transition-all duration-150 disabled:opacity-50"
                        >
                            {loading
                                ? '...'
                                : mode === 'signin'
                                  ? 'Sign in'
                                  : 'Create account'}
                        </button>
                    </form>

                    {/* Toggle sign in / sign up */}
                    <p className="text-center text-xs text-zinc-600 mt-5">
                        {mode === 'signin'
                            ? "Don't have an account? "
                            : 'Already have an account? '}
                        <button
                            onClick={() => {
                                setMode(
                                    mode === 'signin' ? 'signup' : 'signin',
                                );
                                setError(null);
                            }}
                            className="text-[#4f6ef7] hover:text-[#7b93f9] transition-colors"
                        >
                            {mode === 'signin' ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>

                <p className="text-center text-zinc-700 text-xs mt-6">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy.
                </p>
            </div>
        </div>
    );
}
