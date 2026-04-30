'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AccountDropdown from './AccountDropdown';
import SignOutModal from './SignOutModal';

export default function Header() {
    const { signOut, firstName } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut();
        } catch (err) {
            console.error('Sign out failed:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-30 w-full border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-7 h-7 rounded-lg bg-[#4f6ef7] flex items-center justify-center shadow-sm group-hover:bg-[#3a58e0] transition-colors">
                        <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100 group-hover:text-[#4f6ef7] dark:group-hover:text-[#7b93f9] transition-colors">
                        webwidgets
                    </span>
                </Link>

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

            {confirmOpen && (
                <SignOutModal
                    loading={loading}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={async () => {
                        setConfirmOpen(false);
                        await handleSignOut();
                    }}
                />
            )}
        </header>
    );
}
