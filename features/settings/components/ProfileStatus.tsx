'use client';

import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { ProfileStatusProps } from '@/types/settings';

const messages = {
    loading: { text: 'Loading profile...', className: 'text-gray-400' },
    unauthenticated: {
        text: 'Please sign in to view your profile',
        className: 'text-red-500',
    },
};

export default function ProfileStatus({ variant }: ProfileStatusProps) {
    const { text, className } = messages[variant];

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto px-6 lg:px-12 py-12">
                <p className={`text-sm ${className}`}>{text}</p>
            </main>
            <Footer />
        </div>
    );
}
