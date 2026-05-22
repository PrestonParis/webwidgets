'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Puzzle,
    Zap,
    Brain,
    Mail,
    Server,
    Gauge,
    AlertTriangle,
    DollarSign,
    RefreshCw,
    Filter,
    Activity,
    BarChart2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const NAV: NavItem[] = [
    { href: '/metrics/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/metrics/product', label: 'Product', icon: Users },
    { href: '/metrics/widgets', label: 'Widgets', icon: Puzzle },
    { href: '/metrics/actions', label: 'Actions', icon: Zap },
    { href: '/metrics/ml', label: 'ML', icon: Brain },
    { href: '/metrics/email', label: 'Email', icon: Mail },
    { href: '/metrics/jobs', label: 'Jobs', icon: Server },
    { href: '/metrics/performance', label: 'Performance', icon: Gauge },
    { href: '/metrics/errors', label: 'Errors', icon: AlertTriangle },
    { href: '/metrics/costs', label: 'Costs', icon: DollarSign },
    { href: '/metrics/retention', label: 'Retention', icon: RefreshCw },
    { href: '/metrics/funnels', label: 'Funnels', icon: Filter },
    { href: '/metrics/events', label: 'Events', icon: Activity },
];

export function MetricsSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-52 shrink-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
            <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-200 dark:border-zinc-800">
                <BarChart2 size={16} className="text-violet-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                    Metrics
                </span>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active =
                        pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                active
                                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
                            }`}
                        >
                            <Icon size={14} className="shrink-0" />
                            {label}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-800">
                <Link
                    href="/"
                    className="text-xs text-gray-400 dark:text-zinc-600 hover:text-gray-600 transition-colors"
                >
                    ← Dashboard
                </Link>
            </div>
        </aside>
    );
}
