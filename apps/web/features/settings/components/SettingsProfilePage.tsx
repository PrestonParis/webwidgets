'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import ProfileForm from './ProfileForm';
import ProfileStatus from './ProfileStatus';
import { User } from '@supabase/supabase-js';
import { z } from 'zod';

const profileSchema = z.object({
    full_name: z.string().nullable().optional(),
});

export default function ProfilePage() {
    const { user: authUser, status } = useAuthContext();
    const [user, setUser] = useState<User | null>(null);
    const [fullName, setFullName] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (status === 'loading' || !authUser) {
                setLoading(false);
                return;
            }

            const load = async () => {
                setUser(authUser);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', authUser.id)
                    .single();

                const parsed = profileSchema.safeParse(profile);
                setFullName(
                    parsed.success ? (parsed.data.full_name ?? '') : '',
                );
                setLoading(false);
            };

            void load();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [authUser, status]);

    const save = async () => {
        if (!user) return;

        setSaving(true);

        await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        setSaving(false);
    };

    if (loading) return <ProfileStatus variant="loading" />;
    if (!user) return <ProfileStatus variant="unauthenticated" />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-bold">Profile</h1>
                <p className="text-sm text-gray-500">
                    Manage your personal information
                </p>
            </div>
            <ProfileForm
                email={user.email!}
                fullName={fullName}
                saving={saving}
                onNameChange={setFullName}
                onSave={() => {
                    void save();
                }}
            />
        </div>
    );
}
