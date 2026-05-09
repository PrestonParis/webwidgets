'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useRecoveryReviewNotifications } from '@/features/recovery/hooks/useRecoveryReviewNotifications';
import { useAccountDropdown } from '@/features/ui/hooks/useAccountDropdown';
import AccountDropdown from './AccountDropdown';
import SignOutModal from './SignOutModal';
import SearchBar from '@/features/search/components/SearchBar';

export default function Header() {
    useRecoveryReviewNotifications();
    const {
        firstName,
        open,
        setOpen,
        loading,
        confirmOpen,
        setConfirmOpen,
        ref,
        handleSignOut,
    } = useAccountDropdown();

    return (
        <header className="sticky top-0 z-30 w-full border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 group shrink-0"
                >
                    <div className="w-7 h-7 rounded-lg bg-[#4f6ef7] flex items-center justify-center shadow-sm group-hover:bg-[#3a58e0] transition-colors">
                        <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100 group-hover:text-[#4f6ef7] dark:group-hover:text-[#7b93f9] transition-colors">
                        webwidgets
                    </span>
                </Link>

                <div className="flex-1 flex justify-center">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <NotificationBell />
                    <div className="relative" ref={ref}>
                        <AccountDropdown
                            firstName={firstName}
                            open={open}
                            loading={loading}
                            onToggle={() => setOpen((prev) => !prev)}
                            onSignOut={() => {
                                setOpen(false);
                                setConfirmOpen(true);
                            }}
                        />
                    </div>
                </div>
            </div>

            {confirmOpen && (
                <SignOutModal
                    loading={loading}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={() => {
                        setConfirmOpen(false);
                        void handleSignOut();
                    }}
                />
            )}
        </header>
    );
}
