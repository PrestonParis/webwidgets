'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { LogoIsometric } from '@/icons/LogoIsometric';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useRecoveryReviewNotifications } from '@/features/recovery/hooks/useRecoveryReviewNotifications';
import { useAccountDropdown } from '@/features/ui/hooks/useAccountDropdown';
import { useCommandPalette } from '@/features/search/store/useCommandPalette';
import AccountDropdown from './AccountDropdown';
import SignOutModal from './SignOutModal';
import SearchBar from '@/features/search/components/SearchBar';

export default function Header() {
    useRecoveryReviewNotifications();
    const { openPalette } = useCommandPalette();
    const {
        firstName,
        isAdmin,
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
                    <LogoIsometric size={28} />
                    <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100 group-hover:text-[#4f6ef7] dark:group-hover:text-[#7b93f9] transition-colors">
                        webwidgets
                    </span>
                </Link>

                {/* Full search bar — hidden on mobile */}
                <div className="hidden md:flex flex-1 justify-center">
                    <SearchBar />
                </div>

                {/* Search icon on mobile — opens command palette */}
                <button
                    type="button"
                    aria-label="Search"
                    onClick={openPalette}
                    className="md:hidden flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm"
                >
                    <Search size={14} />
                    <span className="text-xs text-zinc-400">Search…</span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                    <NotificationBell />
                    <div className="relative" ref={ref}>
                        <AccountDropdown
                            firstName={firstName}
                            isAdmin={isAdmin}
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
