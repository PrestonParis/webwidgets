import { ReactNode } from 'react';
import { AuthMode } from '@/features/auth/constants';

export interface AuthCardProps {
    children: ReactNode;
}

export interface SignInFormProps {
    onToggleMode: (mode: AuthMode) => void;
}

export interface UseEmailAuthProps {
    mode: AuthMode;
    email: string;
    password: string;
}

export interface GoogleSignInButtonProps {
    onClick: () => void;
}
