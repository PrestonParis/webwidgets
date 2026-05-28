import { useState, useEffect, useCallback } from 'react';
import {
    getAllProviders,
    getProviderOrThrow,
} from '@/features/reading/lib/providerRegistry';
import { bootstrapProviders } from '@/features/reading/providers/index';
import {
    loadLastPosition,
    saveLastPosition,
} from '@/features/reading/lib/readingStorage';
import type {
    ReadingDocument,
    ReadingVersion,
    ReadingStructure,
} from '@/features/reading/types/document';
import type {
    ReadingPosition,
    CanonicalPosition,
} from '@/features/reading/types/positions';

interface UseReadingDocumentState {
    document: ReadingDocument | null;
    versions: ReadingVersion[];
    structure: ReadingStructure | null;
    activeVersionId: string | undefined;
    position: ReadingPosition | null;
    loading: boolean;
    error: string | null;
    setVersion: (id: string) => void;
    navigate: (pos: ReadingPosition) => void;
    navigateChapter: (delta: -1 | 1) => void;
}

export function useReadingDocument(
    documentId: string | null,
): UseReadingDocumentState {
    const [document, setDocument] = useState<ReadingDocument | null>(null);
    const [versions, setVersions] = useState<ReadingVersion[]>([]);
    const [structure, setStructure] = useState<ReadingStructure | null>(null);
    const [activeVersionId, setActiveVersionId] = useState<string | undefined>(
        undefined,
    );
    const [position, setPosition] = useState<ReadingPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useCallback(
        (pos: ReadingPosition) => {
            setPosition(pos);
            if (documentId) saveLastPosition(documentId, pos);
        },
        [documentId],
    );

    useEffect(() => {
        if (!documentId) {
            const timeoutId = window.setTimeout(() => {
                setDocument(null);
            }, 0);
            return () => window.clearTimeout(timeoutId);
        }
        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            setLoading(true);
            setError(null);

            void (async () => {
                try {
                    bootstrapProviders();
                    const providers = getAllProviders();
                    let doc: ReadingDocument | null = null;
                    for (const provider of providers) {
                        try {
                            doc = await provider.getDocument(documentId);
                            break;
                        } catch {
                            // Keep probing providers; document ids are provider scoped.
                        }
                    }
                    if (!doc)
                        throw new Error(
                            `Reading document not found: ${documentId}`,
                        );
                    if (cancelled) return;
                    setDocument(doc);

                    const provider = getProviderOrThrow(doc.providerId);
                    const [versionList, struct] = await Promise.all([
                        provider.getVersions
                            ? provider.getVersions(documentId)
                            : Promise.resolve([]),
                        provider.getStructure(documentId),
                    ]);
                    if (cancelled) return;
                    setVersions(versionList);
                    setStructure(struct);

                    const defaultVersion =
                        versionList.find((v) => v.isDefault) ?? versionList[0];
                    if (defaultVersion) setActiveVersionId(defaultVersion.id);

                    const saved = loadLastPosition(documentId);
                    const startPos: ReadingPosition =
                        saved ??
                        (struct.hasVerses
                            ? {
                                  type: 'canonical',
                                  book: struct.books?.[0]?.name ?? 'Genesis',
                                  chapter: 1,
                              }
                            : { type: 'page', page: 1 });
                    setPosition(startPos);
                } catch (err) {
                    if (!cancelled)
                        setError(
                            err instanceof Error
                                ? err.message
                                : 'Failed to load document',
                        );
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [documentId]);

    const navigateChapter = useCallback(
        (delta: -1 | 1) => {
            if (!position) return;
            if (position.type === 'page') {
                navigate({
                    type: 'page',
                    page: Math.max(1, position.page + delta),
                });
                return;
            }
            if (position.type !== 'canonical') return;
            const next: CanonicalPosition = {
                type: 'canonical',
                book: position.book,
                chapter: Math.max(1, position.chapter + delta),
            };
            navigate(next);
        },
        [position, navigate],
    );

    return {
        document,
        versions,
        structure,
        activeVersionId,
        position,
        loading,
        error,
        setVersion: setActiveVersionId,
        navigate,
        navigateChapter,
    };
}
