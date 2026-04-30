import { useState } from 'react';
import { useEmailAuth } from '@/features/auth/hooks/useEmailAuth';
import { AUTH_MODES, AuthMode } from '@/features/auth/constants';
import { SignInFormProps } from '@/types/auth';

export const SignInForm = ({ onToggleMode }: SignInFormProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<AuthMode>(AUTH_MODES.SIGN_IN);

    const { handleEmailAuth, error, loading, setError } = useEmailAuth();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleEmailAuth({ mode, email, password });
    };

    const toggleMode = () => {
        const newMode =
            mode === AUTH_MODES.SIGN_IN
                ? AUTH_MODES.SIGN_UP
                : AUTH_MODES.SIGN_IN;
        setMode(newMode);
        setError(null);
        onToggleMode(newMode);
    };

    return (
        <>
            <form onSubmit={onSubmit} className="space-y-3">
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
                        className={`text-xs px-1 ${
                            error.includes('Check your email')
                                ? 'text-emerald-400'
                                : 'text-red-400'
                        }`}
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
                        : mode === AUTH_MODES.SIGN_IN
                          ? 'Sign in'
                          : 'Create account'}
                </button>
            </form>

            <p className="text-center text-xs text-zinc-600 mt-5">
                {mode === AUTH_MODES.SIGN_IN
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                <button
                    onClick={toggleMode}
                    className="text-[#4f6ef7] hover:text-[#7b93f9] transition-colors"
                >
                    {mode === AUTH_MODES.SIGN_IN ? 'Sign up' : 'Sign in'}
                </button>
            </p>
        </>
    );
};
