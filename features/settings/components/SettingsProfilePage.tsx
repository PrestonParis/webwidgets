'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import ProfileForm from './ProfileForm';
import ProfileStatus from './ProfileStatus';
import { User } from '@supabase/supabase-js';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [fullName, setFullName] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.auth.getUser();
            const u = data.user;

            setUser(u);

            if (!u) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', u.id)
                .single();

            setFullName(profile?.full_name ?? '');
            setLoading(false);
        };

        load();
    }, []);

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
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto px-6 lg:px-12 py-12 space-y-8">
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
                    onSave={save}
                />
            </main>
            <Footer />
        </div>
    );
}
