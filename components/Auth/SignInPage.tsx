import { useAuth } from '@/hooks/auth/useAuth';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { RadialGlow } from '@/components/ui/RadialGlow';
import { LogoWordmark } from '@/components/ui/LogoWordmark';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { AuthDivider } from '@/components/ui/AuthDivider';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignInForm } from '@/components/auth/SignInForm';

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
