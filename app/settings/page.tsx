'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Global/Header';
import Footer from '@/components/Global/Footer';
import { GoogleIcon } from '@/components/Icons/GoogleIcon';

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
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

            // Check if Google is in the user's identities
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
        };

        load();
    }, []);

    const handleGoogleConnect = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                // Redirect back to this settings page after auth
                redirectTo: `${window.location.origin}/settings`,
            },
        });
        if (error) console.error('Error connecting to Google:', error.message);
    };

    const handleGoogleDisconnect = async () => {
        // In a production app, you might call a custom edge function
        // to revoke tokens or remove the identity from the auth.identities table.
        // For now, we clear the local state and sign out to force a re-auth.
        const confirm = window.confirm(
            'Disconnecting will stop your inbox sync. Continue?',
        );
        if (confirm) {
            await supabase.auth.signOut();
            window.location.href = '/';
        }
    };

    const save = async () => {
        if (!user) return;
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, full_name: fullName });
        setSaving(false);
        if (error) alert('Failed to update name');
    };

    if (loading)
        return (
            <div className="p-6 text-sm text-gray-400">Loading settings...</div>
        );

    return (
        <>
            <Header />
            <div className="max-w-2xl mx-auto p-6 space-y-8 min-h-[80vh]">
                <div>
                    <h1 className="text-xl font-bold">Settings</h1>
                    <p className="text-sm text-gray-500">
                        Manage your account and preferences
                    </p>
                </div>

                {/* Integrations Section */}
                <div className="space-y-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Integrations
                    </h2>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                                <GoogleIcon />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                                    Gmail
                                </p>
                                <p className="text-xs text-gray-500">
                                    {isGmailConnected
                                        ? 'Connected to your inbox'
                                        : 'Not connected'}
                                </p>
                            </div>
                        </div>

                        {isGmailConnected ? (
                            <button
                                onClick={handleGoogleDisconnect}
                                className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-2"
                            >
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={handleGoogleConnect}
                                className="text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                            >
                                Connect
                            </button>
                        )}
                    </div>
                </div>

                {/* Profile section */}
                <div className="space-y-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Profile
                    </h2>
                    <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <div className="text-sm text-gray-700 dark:text-zinc-300 mt-1">
                            {user?.email}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">
                            Full name
                        </label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]"
                            placeholder="Enter your name"
                        />
                    </div>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3a58e0] disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
}
