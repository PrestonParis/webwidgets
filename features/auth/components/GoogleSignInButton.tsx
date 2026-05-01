import { GoogleIcon } from '@/icons/GoogleIcon';
import { GoogleSignInButtonProps } from '@/features/auth/types/auth';

export const GoogleSignInButton = ({ onClick }: GoogleSignInButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-150 mb-5"
        >
            <GoogleIcon />
            Continue with Google
        </button>
    );
};
