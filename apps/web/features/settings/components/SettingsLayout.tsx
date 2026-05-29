'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Palette, Settings, Plug, CreditCard } from 'lucide-react';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const nav = [
        { name: 'General', href: '/settings', icon: Settings },
        { name: 'Profile', href: '/settings/profile', icon: User },
        { name: 'Appearance', href: '/settings/appearance', icon: Palette },
        { name: 'Integrations', href: '/settings/integrations', icon: Plug },
        { name: 'Plan & Billing', href: '/settings/plan', icon: CreditCard },
    ];

    return (
        <div className="flex w-full">
            <aside className="w-56 shrink-0 border-r border-gray-100 dark:border-zinc-800 px-4 py-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-4 px-3">
                    Settings
                </p>
                <nav className="space-y-0.5">
                    {nav.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${active ? 'bg-[#4f6ef7] text-white' : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="flex-1 p-8 max-w-3xl">{children}</main>
        </div>
    );
}
