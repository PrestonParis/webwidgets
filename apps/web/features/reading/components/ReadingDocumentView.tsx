'use client';

import { StructuredTextReaderView } from './views/StructuredTextReaderView';
import { PdfReaderView } from './views/PdfReaderView';
import { ProviderEmbedReaderView } from './views/ProviderEmbedReaderView';
import { useReadingContent } from '@/features/reading/hooks/useReadingContent';
import type { ReadingDocument } from '@/features/reading/types/document';
import type { ReadingPosition } from '@/features/reading/types/positions';
import type { ReadingPreferences } from '@/features/reading/types/plans';
import type { ProviderEmbedContent } from '@/features/reading/types/content';

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
                content={result.content as ProviderEmbedContent}
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
