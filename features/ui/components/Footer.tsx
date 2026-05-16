'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    X,
    Mail,
    GitBranch,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import FooterTos from './FooterTos';
import { LogoIsometric } from '@/icons/LogoIsometric';
import { LogoCircuit } from '@/icons/LogoCircuit';
import { LogoNegativeSpace } from '@/icons/LogoNegativeSpace';

const LOGO_CONCEPTS = [
    { id: 1, label: 'Isometric', element: <LogoIsometric size={56} /> },
    { id: 2, label: 'Circuit', element: <LogoCircuit size={60} /> },
    { id: 3, label: 'Neg. Space', element: <LogoNegativeSpace size={60} /> },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <footer className="w-full border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            {collapsed ? (
                /* Collapsed state — thin bar with up arrow */
                <div className="flex justify-center py-2">
                    <button
                        onClick={() => setCollapsed(false)}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Show footer"
                    >
                        <ChevronUp size={16} />
                    </button>
                </div>
            ) : (
                /* Expanded state */
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14 relative">
                    {/* Hide button */}
                    <button
                        onClick={() => setCollapsed(true)}
                        className="absolute top-4 right-6 lg:right-12 p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Hide footer"
                    >
                        <ChevronDown size={16} />
                    </button>

                    {/* Main grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Brand */}
                        <div>
                            <Link
                                href="/"
                                className="flex items-center gap-2 group mb-4"
                            >
                                <div className="w-8 h-8 rounded-xl bg-[#4f6ef7] flex items-center justify-center shadow-sm group-hover:bg-[#3a58e0] transition-colors">
                                    <LayoutDashboard className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100">
                                    webwidgets
                                </span>
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-xs">
                                A modular dashboard for managing your tools,
                                trackers, and workflows in one place.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-semibold mb-4">
                                Navigation
                            </p>
                            <FooterTos />
                        </div>

                        {/* Connect */}
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-semibold mb-4">
                                Connect
                            </p>
                            <div className="flex items-center gap-3">
                                <a
                                    href="#"
                                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </a>
                                <a
                                    href="#"
                                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    <GitBranch className="w-4 h-4 text-gray-500" />
                                </a>
                                <a
                                    href="mailto:hello@webwidgets.com"
                                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    <Mail className="w-4 h-4 text-gray-500" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-14 pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            © {currentYear} webwidgets. Built for modular
                            productivity.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            Version 1.0
                        </p>
                    </div>

                    {/* Logo concept test row */}
                    <div className="mt-10 pt-6 border-t border-dashed border-gray-100 dark:border-zinc-800">
                        <p className="text-[10px] uppercase tracking-wider text-gray-300 dark:text-zinc-600 font-semibold mb-5">
                            Logo Concepts
                        </p>
                        <div className="flex items-end gap-6 flex-wrap">
                            {LOGO_CONCEPTS.map(({ id, label, element }) => (
                                <div
                                    key={id}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className="w-20 h-16 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                                        {element}
                                    </div>
                                    <span className="text-[9px] uppercase tracking-wider text-gray-300 dark:text-zinc-600">
                                        {String(id).padStart(2, '0')} · {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}
