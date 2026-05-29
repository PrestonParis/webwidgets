'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import FooterTos from './FooterTos';
import { LogoIsometric } from '@/icons/LogoIsometric';

function ToggleButton({
    collapsed,
    onClick,
}: {
    collapsed: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title={collapsed ? 'Show footer' : 'Hide footer'}
        >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
    );
}

function BrandColumn() {
    return (
        <div>
            <Link href="/" className="flex items-center gap-2 group mb-2">
                <LogoIsometric size={22} />
                <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100">
                    webwidgets
                </span>
            </Link>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                A modular dashboard for managing your tools, trackers, and
                workflows in one place.
            </p>
        </div>
    );
}

function NavigationColumn() {
    return (
        <div>
            <ColumnTitle>Navigation</ColumnTitle>
            <FooterTos />
        </div>
    );
}

/*
function ConnectColumn() {
    return (
        <div>
            <ColumnTitle>Connect</ColumnTitle>
            <div className="flex items-center gap-3">
                <SocialLink href="#">
                    <X className="w-4 h-4 text-gray-500" />
                </SocialLink>
                <SocialLink href="#">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                </SocialLink>
                <SocialLink href="mailto:hello@webwidgets.com">
                    <Mail className="w-4 h-4 text-gray-500" />
                </SocialLink>
            </div>
        </div>
    );
}
*/

function ColumnTitle({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-semibold mb-2">
            {children}
        </p>
    );
}

/*
function SocialLink({
    children,
    href,
}: {
    children: React.ReactNode;
    href: string;
}) {
    return (
        <a
            href={href}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
        >
            {children}
        </a>
    );
}
*/

function FooterBottom({ year }: { year: number }) {
    return (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                © {year} webwidgets. Built for modular productivity.
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                Version 1.0
            </p>
        </div>
    );
}

function ExpandedFooter({ onCollapse }: { onCollapse: () => void }) {
    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 relative">
            <div className="absolute top-3 right-6 lg:right-12">
                <ToggleButton collapsed={false} onClick={onCollapse} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 pr-10">
                <BrandColumn />
                <NavigationColumn />
                {/* <ConnectColumn /> */}
            </div>
            <FooterBottom year={new Date().getFullYear()} />
        </div>
    );
}

export default function Footer() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <footer className="w-full border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            {collapsed ? (
                <div className="flex justify-center py-2">
                    <ToggleButton
                        collapsed
                        onClick={() => setCollapsed(false)}
                    />
                </div>
            ) : (
                <ExpandedFooter onCollapse={() => setCollapsed(true)} />
            )}
        </footer>
    );
}
