'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries';
import { journalService } from '@/features/journal/api/journalService';
import type { JournalEntry } from '@/features/journal/types/journal';
import type { NoteType } from '@/features/texteditor/types';

const storageKey = (t: NoteType) => `te_last_${t}_id`;

export function getLastActiveEntryId(noteType: NoteType): number | null {
    if (typeof window === 'undefined') return null;
    const v = localStorage.getItem(storageKey(noteType));
    return v ? parseInt(v, 10) : null;
}

export function setLastActiveEntryId(noteType: NoteType, id: number) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey(noteType), String(id));
    }
}

export function useWidgetEditor(noteType: NoteType) {
    const { user } = useAuth();
    const entryUtils = useJournalEntries(user?.id, noteType);
    const [activeEntry, setActiveEntryState] = useState<JournalEntry | null>(
        null,
    );
    const [isSaving, setIsSaving] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        initialized.current = false;
        const timeoutId = window.setTimeout(() => {
            setActiveEntryState(null);
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [noteType]);

    // Restore last-active entry once the list loads
    useEffect(() => {
        if (initialized.current || entryUtils.entries.length === 0) return;
        initialized.current = true;
        const lastId = getLastActiveEntryId(noteType);
        const found =
            lastId !== null
                ? (entryUtils.entries.find(
                      (e) => e.id === lastId && e.type === noteType,
                  ) ?? null)
                : null;
        setActiveEntryState(
            found ??
                entryUtils.entries.find((e) => e.type === noteType) ??
                null,
        );
    }, [entryUtils.entries, noteType]);

    const setActiveEntry = useCallback(
        (entry: JournalEntry | null) => {
            setActiveEntryState(entry);
            if (entry) setLastActiveEntryId(noteType, entry.id);
        },
        [noteType],
    );

    const handleSave = useCallback(
        async (title: string, content: string) => {
            if (!user?.id) return;
            setIsSaving(true);
            try {
                if (activeEntry) {
                    await journalService.updateEntry(
                        user.id,
                        String(activeEntry.id),
                        title,
                        content,
                    );
                    const updated = { ...activeEntry, title, content };
                    setActiveEntryState(updated);
                    setLastActiveEntryId(noteType, activeEntry.id);
                } else {
                    const { data: newRow } = await journalService.createEntry(
                        user.id,
                        title,
                        content,
                        noteType,
                    );
                    if (newRow) {
                        const entry = newRow as unknown as JournalEntry;
                        setActiveEntry(entry);
                        entryUtils.refreshEntries();
                    }
                }
            } finally {
                setIsSaving(false);
            }
        },
        [user, activeEntry, noteType, entryUtils, setActiveEntry],
    );

    const handleNew = useCallback(() => setActiveEntryState(null), []);

    const handleDelete = useCallback(
        async (id: number) => {
            if (!user?.id) return;
            await journalService.deleteEntry(user.id, String(id));
            if (activeEntry?.id === id) setActiveEntryState(null);
            entryUtils.refreshEntries();
        },
        [user, activeEntry, entryUtils],
    );

    return {
        entries: entryUtils.entries,
        activeEntry,
        isSaving,
        setActiveEntry,
        handleSave,
        handleNew,
        handleDelete,
    };
}
