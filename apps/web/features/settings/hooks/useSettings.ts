import { useEffect, useState } from 'react';
import { db, supabase } from '@/lib/db/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import { startGoogleConnection } from '@/lib/auth/googleConnection';

const profileSchema = z.object({
    full_name: z.string().nullable().optional(),
    use_ai_email: z.boolean().optional(),
    anthropic_api_key: z.string().nullable().optional(),
});

const tokenSchema = z.object({
    has_calendar: z.boolean().optional(),
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
    const profile = parsed.success ? parsed.data : null;
    const token = tokenSchema.safeParse(tokenResult.data);
    return {
        fullName: profile?.full_name ?? '',
        useAIEmail: profile?.use_ai_email ?? false,
        anthropicApiKey: profile?.anthropic_api_key ?? '',
        isGmailConnected: !!googleIdentity,
        isCalendarConnected: token.success
            ? (token.data.has_calendar ?? false)
            : false,
    };
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
        const timeoutId = window.setTimeout(() => {
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
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [user, status]);

    const handleGoogleConnect = () => startGoogleConnection('gmail');
    const handleConnectCalendar = () => startGoogleConnection('calendar');

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
        void db.from('profiles').upsert({ id: user.id, use_ai_email: next });
    };

    const handleSaveApiKey = async () => {
        if (!user) return;
        setSaving(true);
        const { error } = await db.from('profiles').upsert({
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
