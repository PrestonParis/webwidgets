'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useAccountDropdown() {
    const { signOut, firstName } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut();
        } catch (err) {
            console.error('Sign out failed:', err);
            setLoading(false);
        }
    };

    return {
        firstName,
        open,
        setOpen,
        loading,
        confirmOpen,
        setConfirmOpen,
        ref,
        handleSignOut,
    };
}
