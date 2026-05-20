'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Puzzle,
    Zap,
    ScrollText,
    Flag,
    BarChart2,
    Brain,
    Server,
    AlertTriangle,
    Settings,
    Shield,
    type LucideIcon,
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    minRole?: string;
}

const NAV: NavItem[] = [
    { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/widgets', label: 'Widgets', icon: Puzzle },
    { href: '/admin/actions', label: 'Actions', icon: Zap },
    { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
    { href: '/admin/feature-flags', label: 'Feature Flags', icon: Flag },
    { href: '/admin/metrics', label: 'Metrics', icon: BarChart2 },
    { href: '/admin/ml', label: 'ML', icon: Brain },
    { href: '/admin/jobs', label: 'Jobs', icon: Server },
    { href: '/admin/errors', label: 'Errors', icon: AlertTriangle },
    {
        href: '/admin/settings',
        label: 'Settings',
        icon: Settings,
        minRole: 'owner',
    },
];

interface AdminSidebarProps {
    role: string;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
            <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-200 dark:border-zinc-800">
                <Shield size={16} className="text-indigo-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                    Admin Suite
                </span>
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                    {role}
                </span>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                {NAV.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
                            }`}
                        >
                            <Icon size={15} className="shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-800">
                <Link
                    href="/settings"
                    className="text-xs text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 transition-colors"
                >
                    ← Back to settings
                </Link>
            </div>
        </aside>
    );
}
