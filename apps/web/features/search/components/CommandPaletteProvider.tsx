'use client';

import { useEffect, type ReactNode } from 'react';
import { useCommandPalette } from '../store/useCommandPalette';
import { CommandPalette } from './CommandPalette';

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
    const { togglePalette, closePalette } = useCommandPalette();

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const modifier = isMac ? e.metaKey : e.ctrlKey;
            if (modifier && e.key === 'k') {
                e.preventDefault();
                togglePalette();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [togglePalette]);

    return (
        <>
            {children}
            <CommandPalette />
        </>
    );
}
