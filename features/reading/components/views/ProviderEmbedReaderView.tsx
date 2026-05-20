'use client';

// Used when content extraction is not allowed (DRM, provider TOS).
// Only the provider-supplied embed URL is rendered in a sandboxed iframe.
// No content is extracted, copied, or processed outside the iframe.

import type { ProviderEmbedContent } from '@/features/reading/types/content';

interface ProviderEmbedReaderViewProps {
    content: ProviderEmbedContent;
    title?: string;
}

export function ProviderEmbedReaderView({
    content,
    title,
}: ProviderEmbedReaderViewProps) {
    return (
        <div className="flex-1 flex flex-col">
            <iframe
                src={content.embedUrl}
                title={title ?? 'Reading content'}
                sandbox={content.sandboxPolicy as never}
                className="flex-1 w-full border-0 min-h-[500px]"
                referrerPolicy="no-referrer"
                loading="lazy"
            />
        </div>
    );
}
