import type { ReadingPosition } from '@/features/reading/types/positions';
import type { ReadingCitation } from '@/features/reading/types/annotations';
import type {
    ReadingDocument,
    ReadingVersion,
} from '@/features/reading/types/document';
import { formatPosition } from './positionUtils';

export function buildCitation(
    text: string,
    position: ReadingPosition,
    document: ReadingDocument,
    version?: ReadingVersion,
): ReadingCitation {
    const ref = formatPosition(position);
    const versionName = version?.abbreviation ?? version?.name;
    const reference = versionName ? `${ref} (${versionName})` : ref;
    const longRef = version?.name ? `${ref} (${version.name})` : ref;

    const formattedCitation = `"${text}" — ${reference}`;
    const apa = buildApa(text, ref, document, version);
    const mla = buildMla(text, ref, document, version);

    return {
        text,
        reference,
        documentTitle: document.title,
        ...(versionName && { versionName }),
        position,
        formattedCitation,
        formats: {
            short: ref,
            long: longRef,
            ...(apa && { apa }),
            ...(mla && { mla }),
        },
    };
}

function buildApa(
    _text: string,
    ref: string,
    document: ReadingDocument,
    version?: ReadingVersion,
): string | undefined {
    if (document.type !== 'religious_text') return undefined;
    const vAbbr = version?.abbreviation ?? '';
    return vAbbr ? `${ref} (${vAbbr})` : ref;
}

function buildMla(
    text: string,
    ref: string,
    document: ReadingDocument,
    version?: ReadingVersion,
): string | undefined {
    if (document.type !== 'religious_text') return undefined;
    const vName = version?.name ?? document.title;
    return `"${text}" ${document.title}, ${ref}, ${vName}.`;
}

export function copyCitationToClipboard(citation: ReadingCitation): void {
    void navigator.clipboard.writeText(citation.formattedCitation);
}
