import { useState, useRef } from 'react';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { useClickOutside } from '@/features/widgets/hooks/useClickOutside';

export function useFolderNameSection(folder: WidgetConfig) {
    const [editing, setEditing] = useState(false);
    const [draftName, setDraftName] = useState(
        folder.props?.folderName ?? 'New Folder',
    );
    const [pinOpen, setPinOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const pinRef = useRef<HTMLDivElement>(null);
    useClickOutside(pinRef, () => setPinOpen(false), pinOpen);
    return {
        editing,
        setEditing,
        draftName,
        setDraftName,
        pinOpen,
        setPinOpen,
        inputRef,
        pinRef,
    };
}
