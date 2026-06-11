import { supportedConversionMatrix } from './matrix';
import type { ConversionExtension } from './core';

export function isConversionExtension(
    value: string,
): value is ConversionExtension {
    return [
        'doc',
        'docx',
        'rtf',
        'ppt',
        'pptx',
        'xls',
        'xlsx',
        'ods',
        'odp',
        'odt',
        'html',
        'htm',
        'md',
        'markdown',
        'txt',
        'pdf',
        'csv',
        'epub',
        'png',
        'jpg',
        'jpeg',
        'webp',
        'gif',
        'tiff',
        'bmp',
        'svg',
    ].includes(value);
}

export function getConversionMetadata(
    sourceExtension: string,
    targetExtension: string,
) {
    return supportedConversionMatrix.find(
        (conversion) =>
            conversion.sourceExtension === sourceExtension &&
            conversion.targetExtension === targetExtension,
    );
}
