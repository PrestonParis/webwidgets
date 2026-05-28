'use client';

import dynamic from 'next/dynamic';
import { StructuredTextReaderView } from './views/StructuredTextReaderView';
import { ProviderEmbedReaderView } from './views/ProviderEmbedReaderView';

// pdfjs-dist crashes during Turbopack's CJS→ESM transform when bundled eagerly.
// Dynamic import defers it to a separate chunk that only loads at render time,
// after the browser has a proper module environment.
const PdfReaderView = dynamic(
    () =>
        import('./views/PdfReaderView').then((m) => ({
            default: m.PdfReaderView,
        })),
    { ssr: false },
);
import { useReadingContent } from '@/features/reading/hooks/useReadingContent';
import type { ReadingDocument } from '@/features/reading/types/document';
import type { ReadingPosition } from '@/features/reading/types/positions';
import type { ReadingPreferences } from '@/features/reading/types/plans';

interface ReadingDocumentViewProps {
    document: ReadingDocument;
    position: ReadingPosition;
    versionId: string | undefined;
    prefs: ReadingPreferences;
    onVerseSelect?: (verse: { number: number; text: string }) => void;
    onPageChange?: (page: number) => void;
}

export function ReadingDocumentView({
    document,
    position,
    versionId,
    prefs,
    onVerseSelect,
    onPageChange,
}: ReadingDocumentViewProps) {
    const { result, loading, error } = useReadingContent(
        document.providerId,
        document.id,
        position,
        versionId,
    );

    const renderMode = document.defaultRenderMode;

    if (renderMode === 'pdf_canvas' || renderMode === 'image_pages') {
        return (
            <PdfReaderView
                result={result}
                document={document}
                loading={loading}
                error={error}
                {...(onPageChange && { onPageChange })}
            />
        );
    }

    if (
        renderMode === 'provider_embed' &&
        result?.content.type === 'provider_embed'
    ) {
        return (
            <ProviderEmbedReaderView
                content={result.content}
                title={document.title}
            />
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <StructuredTextReaderView
                result={result}
                prefs={prefs}
                loading={loading}
                error={error}
                {...(onVerseSelect && { onVerseSelect })}
            />
        </div>
    );
}
