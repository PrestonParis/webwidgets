import { useState, useRef } from 'react';
import { useClickOutside } from '@/features/widgets/hooks/useClickOutside';

export function useFolderControlsBar() {
    const [colorOpen, setColorOpen] = useState(false);
    const [bgOpen, setBgOpen] = useState(false);
    const [visOpen, setVisOpen] = useState(false);
    const colorRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const visRef = useRef<HTMLDivElement>(null);
    const folderFileInputRef = useRef<HTMLInputElement>(null);
    useClickOutside(colorRef, () => setColorOpen(false), colorOpen);
    useClickOutside(bgRef, () => setBgOpen(false), bgOpen);
    useClickOutside(visRef, () => setVisOpen(false), visOpen);
    return {
        colorOpen,
        setColorOpen,
        bgOpen,
        setBgOpen,
        visOpen,
        setVisOpen,
        colorRef,
        bgRef,
        visRef,
        folderFileInputRef,
    };
}
