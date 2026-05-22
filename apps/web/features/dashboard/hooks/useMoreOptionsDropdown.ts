import { useState, useRef, useEffect } from 'react';

export function useMoreOptionsDropdown() {
    const [open, setOpen] = useState(false);
    const [bgOpen, setBgOpen] = useState(false);
    const [scenesOpen, setScenesOpen] = useState(false);
    const [resetConfirming, setResetConfirming] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setBgOpen(false);
                setScenesOpen(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    function closeAll() {
        setOpen(false);
        setBgOpen(false);
        setScenesOpen(false);
    }

    return {
        open,
        setOpen,
        bgOpen,
        setBgOpen,
        scenesOpen,
        setScenesOpen,
        resetConfirming,
        setResetConfirming,
        ref,
        closeAll,
    };
}
