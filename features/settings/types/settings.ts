import { User } from '@supabase/supabase-js';

export interface SettingsIntegrationCardProps {
    isGmailConnected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
}

export interface SettingsProfileCardProps {
    user: User;
    fullName: string;
    saving: boolean;
    onNameChange: (name: string) => void;
    onSave: () => void;
}

export interface ProfileFormProps {
    email: string;
    fullName: string;
    saving: boolean;
    onNameChange: (value: string) => void;
    onSave: () => void;
}

export interface ProfileStatusProps {
    variant: 'loading' | 'unauthenticated';
}
