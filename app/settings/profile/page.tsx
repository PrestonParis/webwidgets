'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import Header from '@/components/global/Header';
import Footer from '@/components/global/Footer';
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

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
                <Header />
                <main className="flex-1 max-w-2xl mx-auto px-6 lg:px-12 py-12">
                    <div className="text-sm text-gray-400">
                        Loading profile...
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
                <Header />
                <main className="flex-1 max-w-2xl mx-auto px-6 lg:px-12 py-12">
                    <div className="text-sm text-red-500">
                        Please sign in to view your profile
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

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

                <div className="space-y-6 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
                    {/* Email */}
                    <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <p className="text-sm text-gray-700 dark:text-zinc-300 mt-1">
                            {user.email}
                        </p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-xs text-gray-500">
                            Full name
                        </label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]"
                            placeholder="Your name"
                        />
                    </div>

                    <button
                        onClick={save}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3a58e0] disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
