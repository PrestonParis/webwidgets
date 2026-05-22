'use client';

import Link from 'next/link';
import { HelpCircle, Settings, User, LogOut, ChevronDown, MessageSquare, Sun, Moon, Accessibility, Shield } from 'lucide-react';
import { AccountDropdownProps } from '@/features/ui/types/ui';
import { useTheme } from '@/features/ui/hooks/useTheme';

export default function AccountDropdown({
    firstName,
    isAdmin,
    open,
    loading,
    onToggle,
    onSignOut,
}: AccountDropdownProps) {
    const { isDark, toggle } = useTheme();
    return (
        <>
            <button
                onClick={onToggle}
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
                    className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800">
                        <p className="text-xs font-semibold">
                            {firstName ?? 'User'}
                        </p>
                        <p className="text-[11px] text-gray-400">Account</p>
                    </div>
                    <Link
                        href="/settings"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <Settings className="w-3.5 h-3.5 text-gray-400" />
                        Settings
                    </Link>
                    <Link
                        href="/settings/profile"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Profile
                    </Link>
                    <Link
                        href="/accessibility"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <Accessibility className="w-3.5 h-3.5 text-gray-400" />
                        Accessibility
                    </Link>
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={onToggle}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                        >
                            <Shield className="w-3.5 h-3.5 text-gray-400" />
                            Admin
                        </Link>
                    )}
                    <Link
                        href="/help"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                        Help
                    </Link>
                    <Link
                        href="/feedback"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        Feedback
                    </Link>
                    <button
                        onClick={toggle}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-left"
                    >
                        {isDark ? (
                            <Sun className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                            <Moon className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        {isDark ? 'Light mode' : 'Dark mode'}
                    </button>
                    <div className="my-2 border-t border-gray-100 dark:border-zinc-800" />
                    <button
                        onClick={onSignOut}
                        disabled={loading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-50"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        {loading ? 'Signing out...' : 'Sign out'}
                    </button>
                </div>
            )}
        </>
    );
}
