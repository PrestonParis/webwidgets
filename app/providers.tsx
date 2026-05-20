'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { TickProvider } from '@/lib/tick';
import { ContextCaptureGateway } from '@/features/context/components/ContextCaptureGateway';
import { NewsQueryProvider } from '@/features/news/components/QueryProvider';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <NewsQueryProvider>
            <AuthProvider>
                <ContextCaptureGateway>
                    <TickProvider>{children}</TickProvider>
                </ContextCaptureGateway>
            </AuthProvider>
        </NewsQueryProvider>
    );
}
