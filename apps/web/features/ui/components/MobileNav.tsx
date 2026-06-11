'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Mail,
    DollarSign,
    Activity,
    Settings,
    Search,
    Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useCommandPalette } from '@/features/search/store/useCommandPalette';
import { useActivityUnreadCount } from '@/features/activity/hooks/useActivityUnreadCount';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Finance', href: '/finance', icon: DollarSign },
    { label: 'Tracking', href: '/tracking', icon: Activity },
    { label: 'Inbox', href: '/inbox', icon: Mail },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();
    const { openPalette } = useCommandPalette();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { data: unreadCount = 0 } = useActivityUnreadCount();

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    if (isFullscreen) return null;

    return (
        <nav
            aria-label="Mobile navigation"
            className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 flex items-center safe-area-inset-bottom"
        >
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const active =
                    pathname === href ||
                    (href !== '/' && pathname.startsWith(href));
                return (
                    <Link
                        key={href}
                        href={href}
                        aria-label={label}
                        className={cn(
                            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-14 transition-colors',
                            active
                                ? 'text-brand'
                                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300',
                        )}
                    >
                        <Icon size={20} />
                        <span className="text-[9px] font-medium leading-none">
                            {label}
                        </span>
                    </Link>
                );
            })}

            {/* Activity nav item with unread badge */}
            <Link
                href="/activity"
                aria-label={
                    unreadCount > 0
                        ? `Activity — ${unreadCount} unread`
                        : 'Activity'
                }
                className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-14 transition-colors relative',
                    pathname.startsWith('/activity')
                        ? 'text-brand'
                        : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300',
                )}
            >
                <span className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span
                            aria-hidden="true"
                            className="absolute -top-1 -right-1.5 min-w-4 h-4 px-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center leading-none"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </span>
                <span className="text-[9px] font-medium leading-none">
                    Activity
                </span>
            </Link>

            <button
                type="button"
                aria-label="Search"
                onClick={openPalette}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-14 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            >
                <Search size={20} />
                <span className="text-[9px] font-medium leading-none">
                    Search
                </span>
            </button>
        </nav>
    );
}
