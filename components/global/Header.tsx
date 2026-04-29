'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
    LayoutDashboard,
    Settings,
    ChevronDown,
    User,
    LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';

export default function Header() {
    const { signOut, firstName } = useAuth();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleSignOut = async () => {
        setLoading(true);

        try {
            await signOut();
        } catch (err) {
            console.error('Sign out failed:', err);
            setLoading(false);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-30 w-full border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
                {/* Left — Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-7 h-7 rounded-lg bg-[#4f6ef7] flex items-center justify-center shadow-sm group-hover:bg-[#3a58e0] transition-colors">
                        <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100 group-hover:text-[#4f6ef7] dark:group-hover:text-[#7b93f9] transition-colors">
                        webwidgets
                    </span>
                </Link>

                {/* Right — Account dropdown */}
                <div className="relative" ref={ref}>
                    <button
                        onClick={() => setOpen((prev) => !prev)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600 shadow-sm transition-all text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                    >
                        <div className="w-5 h-5 rounded-full bg-[#4f6ef7]/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-[#4f6ef7]">
                                {firstName?.[0]?.toUpperCase() ?? '?'}
                            </span>
                        </div>
                        <span className="text-xs font-medium hidden sm:block">
                            {firstName ?? 'Account'}
                        </span>
                        <ChevronDown
                            className={`w-3 h-3 transition-transform duration-200 ${
                                open ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl p-2 z-50">
                            {/* User Info */}
                            <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800">
                                <p className="text-xs font-semibold">
                                    {firstName ?? 'User'}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                    Account
                                </p>
                            </div>

                            {/* Navigation */}
                            <Link
                                href="/settings"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                            >
                                <Settings className="w-3.5 h-3.5 text-gray-400" />
                                Settings
                            </Link>

                            <Link
                                href="/settings/profile"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                            >
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                Profile
                            </Link>

                            {/* Divider */}
                            <div className="my-2 border-t border-gray-100 dark:border-zinc-800" />

                            {/* Sign Out */}
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    setConfirmOpen(true);
                                }}
                                disabled={loading}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-50"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                {loading ? 'Signing out...' : 'Sign out'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setConfirmOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-6">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Sign out
                        </h2>

                        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                            Are you sure you want to sign out?
                        </p>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    setConfirmOpen(false);
                                    await handleSignOut();
                                }}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                            >
                                {loading ? 'Signing out...' : 'Sign out'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
