import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BackgroundGrid } from './BackgroundGrid';
import { RadialGlow } from '@/features/ui/components/RadialGlow';
import { LogoWordmark } from '@/features/ui/components/LogoWordmark';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { AuthDivider } from './AuthDivider';
import { AuthCard } from './AuthCard';
import { SignInForm } from './SignInForm';

export default function SignInPage() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 relative overflow-hidden">
            <BackgroundGrid />
            <RadialGlow />

            <div className="relative z-10 w-full max-w-sm">
                <LogoWordmark />

                <AuthCard>
                    <GoogleSignInButton
                        onClick={() => {
                            void signInWithGoogle();
                        }}
                    />
                    <AuthDivider />
                    <SignInForm onToggleMode={() => {}} />
                </AuthCard>

                <p className="text-center text-zinc-700 text-xs mt-6">
                    By continuing, you agree to our{' '}
                    <Link
                        href="/terms"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
                    >
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                        href="/privacy"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
