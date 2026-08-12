'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/components/AuthContext';
import { AccessibilityProvider } from '@/features/accessibility/components/AccessibilityContext';
import { TickProvider } from '@/lib/tick';
import { ContextCaptureGateway } from '@/features/context/components/ContextCaptureGateway';
import { NewsQueryProvider } from '@/features/news/components/QueryProvider';
import { ToastProvider } from '@/features/ui/components/ToastProvider';
import { CommandPaletteProvider } from '@/features/search/components/CommandPaletteProvider';
import { InteractionTracker } from '@/features/analytics/components/InteractionTracker';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <AccessibilityProvider>
            <NewsQueryProvider>
                <AuthProvider>
                    <ContextCaptureGateway>
                        <TickProvider>
                            <ToastProvider>
                                <CommandPaletteProvider>
                                    <InteractionTracker />
                                    {children}
                                </CommandPaletteProvider>
                            </ToastProvider>
                        </TickProvider>
                    </ContextCaptureGateway>
                </AuthProvider>
            </NewsQueryProvider>
        </AccessibilityProvider>
    );
}
