'use client';

import type { ReadingContentResult } from '@/features/reading/types/providers';
import type {
    StructuredTextContent,
    ReadingVerse,
} from '@/features/reading/types/content';
import type { ReadingPreferences } from '@/features/reading/types/plans';
import { cn } from '@/lib/utils/utils';

const FONT_SIZE_CLS: Record<ReadingPreferences['fontSize'], string> = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
};
const LINE_HEIGHT_CLS: Record<ReadingPreferences['lineHeight'], string> = {
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
};
const FONT_FAMILY_CLS: Record<ReadingPreferences['fontFamily'], string> = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
};
const COLUMN_WIDTH_CLS: Record<ReadingPreferences['columnWidth'], string> = {
    narrow: 'max-w-sm',
    normal: 'max-w-xl',
    wide: 'max-w-3xl',
    full: 'max-w-none',
};

interface VerseItemProps {
    verse: ReadingVerse;
    showNumbers: boolean;
    onSelect?: (verse: ReadingVerse) => void;
}

function VerseItem({ verse, showNumbers, onSelect }: VerseItemProps) {
    return (
        <span className="group">
            {showNumbers && (
                <sup className="text-[10px] text-zinc-400 dark:text-zinc-500 mr-1 select-none font-semibold">
                    {verse.number}
                </sup>
            )}
            <span
                className="hover:bg-yellow-50 dark:hover:bg-yellow-950/20 rounded cursor-pointer transition-colors"
                onClick={() => onSelect?.(verse)}
            >
                {verse.text}
            </span>{' '}
        </span>
    );
}

interface StructuredTextReaderViewProps {
    result: ReadingContentResult | null;
    prefs: ReadingPreferences;
    loading: boolean;
    error: string | null;
    onVerseSelect?: (verse: ReadingVerse) => void;
}

export function StructuredTextReaderView({
    result,
    prefs,
    loading,
    error,
    onVerseSelect,
}: StructuredTextReaderViewProps) {
    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (error) {
        return (
            <p className="text-sm text-red-500 dark:text-red-400 p-6">
                {error}
            </p>
        );
    }
    if (!result) {
        return (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 p-6">
                No content.
            </p>
        );
    }

    const content = result.content as StructuredTextContent;
    const containerCls = cn(
        'mx-auto px-6 py-8',
        FONT_SIZE_CLS[prefs.fontSize],
        LINE_HEIGHT_CLS[prefs.lineHeight],
        FONT_FAMILY_CLS[prefs.fontFamily],
        COLUMN_WIDTH_CLS[prefs.columnWidth],
        'text-gray-900 dark:text-zinc-100',
    );

    if (content.verses && content.verses.length > 0) {
        return (
            <div className={containerCls}>
                <p>
                    {content.verses.map((v) => (
                        <VerseItem
                            key={v.number}
                            verse={v}
                            showNumbers={prefs.showVerseNumbers}
                            {...(onVerseSelect && { onSelect: onVerseSelect })}
                        />
                    ))}
                </p>
                {prefs.showFootnotes &&
                    content.footnotes &&
                    content.footnotes.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-1">
                            {content.footnotes.map((fn) => (
                                <p
                                    key={fn.index}
                                    className="text-xs text-zinc-500 dark:text-zinc-400"
                                >
                                    <span className="font-semibold mr-1">
                                        {fn.marker}
                                    </span>
                                    {fn.text}
                                </p>
                            ))}
                        </div>
                    )}
            </div>
        );
    }

    if (content.paragraphs && content.paragraphs.length > 0) {
        return (
            <div className={containerCls}>
                {content.paragraphs.map((para) =>
                    para.isHeading ? (
                        <h3
                            key={para.index}
                            className={`font-bold mb-3 mt-6 ${para.headingLevel === 1 ? 'text-xl' : para.headingLevel === 2 ? 'text-lg' : 'text-base'}`}
                        >
                            {para.text}
                        </h3>
                    ) : (
                        <p key={para.index} className="mb-4">
                            {para.text}
                        </p>
                    ),
                )}
            </div>
        );
    }

    return (
        <div
            className={`${containerCls} bible-content`}
            dangerouslySetInnerHTML={{ __html: content.rawHtml ?? '' }}
        />
    );
}
