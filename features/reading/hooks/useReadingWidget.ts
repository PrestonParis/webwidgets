// Aggregates all reading state into one hook so ReadingWidget.tsx
// stays under the 6-hook-call limit for .tsx files.
import { useState, useCallback } from 'react';
import { useReadingDocument } from './useReadingDocument';
import { useReadingState } from './useReadingState';
import { useReadingPreferences } from './useReadingPreferences';
import { useReadingSearch } from './useReadingSearch';
import type { ReadingPanel } from '@/features/reading/components/ReadingToolbar';

export function useReadingWidget() {
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(
        null,
    );
    const [activePanel, setActivePanel] = useState<ReadingPanel>(null);

    const docState = useReadingDocument(activeDocumentId);
    const annotState = useReadingState(activeDocumentId);
    const { prefs, update: updatePrefs } = useReadingPreferences();
    const searchState = useReadingSearch(
        docState.document?.providerId ?? null,
        activeDocumentId,
        docState.activeVersionId,
    );

    const openDocument = useCallback((id: string) => {
        setActiveDocumentId(id);
        setActivePanel(null);
    }, []);

    const closeDocument = useCallback(() => {
        setActiveDocumentId(null);
        setActivePanel(null);
    }, []);

    return {
        activeDocumentId,
        activePanel,
        setActivePanel,
        openDocument,
        closeDocument,
        docState,
        annotState,
        prefs,
        updatePrefs,
        searchState,
    };
}
