import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export function useSettings() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isGmailConnected, setIsGmailConnected] = useState(false);

    useEffect(() => {
        const load = async () => {
            const {
                data: { user: u },
            } = await supabase.auth.getUser();
            setUser(u);
            if (!u) return;

            const googleIdentity = u.identities?.find(
                (id) => id.provider === 'google',
            );
            setIsGmailConnected(!!googleIdentity);

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', u.id)
                .single();

            setFullName(profile?.full_name ?? '');
            setLoading(false);
            return;
        };

        load();
    }, []);

    const handleGoogleConnect = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: { access_type: 'offline', prompt: 'consent' },
                redirectTo: `${window.location.origin}/settings`,
            },
        });
        if (error) console.error('Error connecting to Google:', error.message);
    };

    const handleGoogleDisconnect = async () => {
        const confirmed = window.confirm(
            'Disconnecting will stop your inbox sync. Continue?',
        );
        if (!confirmed) return;

        await supabase.auth.signOut();
        router.push('/');
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, full_name: fullName });
        setSaving(false);
        if (error) alert('Failed to update name');
    };

    return {
        user,
        fullName,
        setFullName,
        loading,
        saving,
        isGmailConnected,
        handleGoogleConnect,
        handleGoogleDisconnect,
        handleSave,
    };
}
