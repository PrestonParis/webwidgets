"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Global/Header";
import Footer from "@/components/Global/Footer";

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isGmailConnected, setIsGmailConnected] = useState(false);

    useEffect(() => {
        const load = async () => {
            const { data: { user: u } } = await supabase.auth.getUser();
            setUser(u);

            if (!u) return;

            // Check if Google is in the user's identities
            const googleIdentity = u.identities?.find(id => id.provider === 'google');
            setIsGmailConnected(!!googleIdentity);

            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", u.id)
                .single();

            setFullName(profile?.full_name ?? "");
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
        if (error) console.error("Error connecting to Google:", error.message);
    };

    const handleGoogleDisconnect = async () => {
        // In a production app, you might call a custom edge function 
        // to revoke tokens or remove the identity from the auth.identities table.
        // For now, we clear the local state and sign out to force a re-auth.
        const confirm = window.confirm("Disconnecting will stop your inbox sync. Continue?");
        if (confirm) {
            await supabase.auth.signOut();
            window.location.href = "/";
        }
    };

    const save = async () => {
        if (!user) return;
        setSaving(true);
        const { error } = await supabase
            .from("profiles")
            .upsert({ id: user.id, full_name: fullName });
        setSaving(false);
        if (error) alert("Failed to update name");
    };

    if (loading) return <div className="p-6 text-sm text-gray-400">Loading settings...</div>;

    return (
        <>
            <Header />
            <div className="max-w-2xl mx-auto p-6 space-y-8 min-h-[80vh]">
                <div>
                    <h1 className="text-xl font-bold">Settings</h1>
                    <p className="text-sm text-gray-500">Manage your account and preferences</p>
                </div>

                {/* Integrations Section */}
                <div className="space-y-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Integrations</h2>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">Gmail</p>
                                <p className="text-xs text-gray-500">
                                    {isGmailConnected ? "Connected to your inbox" : "Not connected"}
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
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Profile</h2>
                    <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <div className="text-sm text-gray-700 dark:text-zinc-300 mt-1">{user?.email}</div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Full name</label>
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
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
}