'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Mail,
    DollarSign,
    Activity,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useCommandPalette } from '@/features/search/store/useCommandPalette';
import { Search } from 'lucide-react';

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

    return (
        <nav
            aria-label="Mobile navigation"
            className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 flex items-center safe-area-inset-bottom"
        >
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                    <Link
                        key={href}
                        href={href}
                        aria-label={label}
                        className={cn(
                            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors',
                            active
                                ? 'text-brand'
                                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300',
                        )}
                    >
                        <Icon size={20} />
                        <span className="text-[9px] font-medium leading-none">{label}</span>
                    </Link>
                );
            })}
            <button
                type="button"
                aria-label="Search"
                onClick={openPalette}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            >
                <Search size={20} />
                <span className="text-[9px] font-medium leading-none">Search</span>
            </button>
        </nav>
    );
}
