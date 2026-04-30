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
                    <GoogleSignInButton onClick={signInWithGoogle} />
                    <AuthDivider />
                    <SignInForm onToggleMode={() => {}} />
                </AuthCard>

                <p className="text-center text-zinc-700 text-xs mt-6">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy.
                </p>
            </div>
        </div>
    );
}
