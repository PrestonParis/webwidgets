'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Palette, Settings } from 'lucide-react';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const nav = [
        {
            name: 'Profile',
            href: '/settings/profile',
            icon: User,
        },
        {
            name: 'Appearance',
            href: '/settings/appearance',
            icon: Palette,
        },
        {
            name: 'General',
            href: '/settings',
            icon: Settings,
        },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-100 dark:border-zinc-800 px-4 py-6">
                <h2 className="text-sm font-bold mb-6 text-gray-900 dark:text-zinc-100">
                    Settings
                </h2>

                <nav className="space-y-1">
                    {nav.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${
                                    active
                                        ? 'bg-[#4f6ef7] text-white'
                                        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 p-8">{children}</main>
        </div>
    );
}
