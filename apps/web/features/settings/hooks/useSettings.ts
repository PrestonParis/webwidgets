import { useEffect, useState } from 'react';
import { db, supabase } from '@/lib/db/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuthContext } from '@/features/auth/context/AuthContext';

const profileSchema = z.object({
    full_name: z.string().nullable().optional(),
    use_ai_email: z.boolean().optional(),
    anthropic_api_key: z.string().nullable().optional(),
});

interface SettingsData {
    fullName: string;
    useAIEmail: boolean;
    anthropicApiKey: string;
    isGmailConnected: boolean;
    isCalendarConnected: boolean;
}

async function fetchUserSettingsData(user: User): Promise<SettingsData> {
    const googleIdentity = user.identities?.find(
        (id) => id.provider === 'google',
    );
    const [profileResult, tokenResult] = await Promise.all([
        db
            .from('profiles')
            .select('full_name, use_ai_email, anthropic_api_key')
            .eq('id', user.id)
            .single(),
        db
            .from('user_tokens')
            .select('has_calendar')
            .eq('user_id', user.id)
            .maybeSingle(),
    ]);
    const parsed = profileSchema.safeParse(profileResult.data);
    return {
        fullName: parsed.success ? (parsed.data.full_name ?? '') : '',
        useAIEmail: profileResult.data?.use_ai_email ?? false,
        anthropicApiKey: profileResult.data?.anthropic_api_key ?? '',
        isGmailConnected: !!googleIdentity,
        isCalendarConnected: tokenResult.data?.has_calendar ?? false,
    };
}

async function connectGmailOAuth(origin: string) {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: 'https://www.googleapis.com/auth/gmail.readonly',
            queryParams: { access_type: 'offline', prompt: 'consent' },
            redirectTo: `${origin}/auth/callback`,
        },
    });
    if (error) console.error('Error connecting to Google:', error.message);
}

async function connectCalendarOAuth(origin: string) {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/calendar.events',
            ].join(' '),
            queryParams: { access_type: 'offline', prompt: 'consent' },
            redirectTo: `${origin}/auth/callback`,
        },
    });
    if (error) console.error('Error connecting calendar:', error.message);
}

export function useSettings() {
    const router = useRouter();
    const { user, status } = useAuthContext();
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isGmailConnected, setIsGmailConnected] = useState(false);
    const [isCalendarConnected, setIsCalendarConnected] = useState(false);
    const [useAIEmail, setUseAIEmail] = useState(false);
    const [anthropicApiKey, setAnthropicApiKey] = useState('');

    useEffect(() => {
        if (status === 'loading' || !user) {
            setLoading(false);
            return;
        }

        const load = async () => {
            const data = await fetchUserSettingsData(user);
            setFullName(data.fullName);
            setUseAIEmail(data.useAIEmail);
            setAnthropicApiKey(data.anthropicApiKey);
            setIsGmailConnected(data.isGmailConnected);
            setIsCalendarConnected(data.isCalendarConnected);
            setLoading(false);
        };
        void load();
    }, [user, status]);

    const handleGoogleConnect = () => connectGmailOAuth(window.location.origin);
    const handleConnectCalendar = () =>
        connectCalendarOAuth(window.location.origin);

    const handleGoogleDisconnect = async () => {
        if (
            !window.confirm(
                'Disconnecting will stop your inbox sync. Continue?',
            )
        )
            return;
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        const { error } = await db
            .from('profiles')
            .upsert({ id: user.id, full_name: fullName });
        setSaving(false);
        if (error) alert('Failed to update name');
    };

    const handleToggleAIEmail = () => {
        if (!user) return;
        const next = !useAIEmail;
        setUseAIEmail(next);
        void db
            .from('profiles')
            .upsert({ id: user.id, use_ai_email: next });
    };

    const handleSaveApiKey = async () => {
        if (!user) return;
        setSaving(true);
        const { error } = await db
            .from('profiles')
            .upsert({
                id: user.id,
                anthropic_api_key: anthropicApiKey || null,
            });
        setSaving(false);
        if (error) alert('Failed to save API key');
    };

    return {
        user,
        fullName,
        setFullName,
        loading,
        saving,
        isGmailConnected,
        isCalendarConnected,
        useAIEmail,
        anthropicApiKey,
        setAnthropicApiKey,
        handleGoogleConnect,
        handleConnectCalendar,
        handleGoogleDisconnect,
        handleSave,
        handleToggleAIEmail,
        handleSaveApiKey,
    };
}
