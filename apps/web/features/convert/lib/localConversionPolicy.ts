import {
    isConversionExtension,
    supportedConversionMatrix,
    type ConversionExtension,
} from '@/features/convert/types/conversion';

export type ConversionPlacement = 'local' | 'remote' | 'unsupported';

const tinyLocalLimitBytes = 512 * 1024;
const localRoutes = new Set([
    'md:html',
    'txt:html',
    'html:txt',
    'md:txt',
    'txt:md',
]);
const riskyRemoteExtensions = new Set([
    'doc',
    'docx',
    'ppt',
    'pptx',
    'xls',
    'xlsx',
    'ods',
    'odp',
    'odt',
    'epub',
    'pdf',
    'zip',
    'rar',
    '7z',
    'png',
    'jpg',
    'jpeg',
    'webp',
    'mp4',
    'mov',
    'mp3',
]);

export function inferExtension(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) return 'unknown';
    if (extension === 'markdown') return 'md';
    if (extension === 'htm') return 'html';
    if (extension === 'jpeg') return 'jpg';
    return extension;
}

export function chooseLocalOrRemoteConversion(
    file: File,
    targetExtension: string,
): ConversionPlacement {
    const sourceExtension = inferExtension(file);
    const route = `${sourceExtension}:${targetExtension}`;

    if (
        file.size <= tinyLocalLimitBytes &&
        localRoutes.has(route) &&
        !riskyRemoteExtensions.has(sourceExtension)
    ) {
        return 'local';
    }

    if (
        isConversionExtension(sourceExtension) &&
        isConversionExtension(targetExtension) &&
        supportedConversionMatrix.some(
            (conversion) =>
                conversion.sourceExtension === sourceExtension &&
                conversion.targetExtension === targetExtension,
        )
    ) {
        return 'remote';
    }

    return 'unsupported';
}

const IMAGE_EXTENSIONS = new Set<string>([
    'png',
    'jpg',
    'jpeg',
    'webp',
    'gif',
    'tiff',
    'bmp',
    'svg',
]);

export function getTargetsForSource(
    sourceExtension: string,
): ConversionExtension[] {
    if (!isConversionExtension(sourceExtension)) return ['pdf'];

    const remoteTargets = supportedConversionMatrix
        .filter((conversion) => conversion.sourceExtension === sourceExtension)
        .map((conversion) => conversion.targetExtension);

    // Images are always remote — no local browser conversion.
    if (IMAGE_EXTENSIONS.has(sourceExtension)) {
        return Array.from(new Set(remoteTargets));
    }

    const localTargets =
        sourceExtension === 'md'
            ? (['html', 'txt'] as ConversionExtension[])
            : sourceExtension === 'txt'
              ? (['html', 'md'] as ConversionExtension[])
              : sourceExtension === 'html'
                ? (['txt'] as ConversionExtension[])
                : [];
    return Array.from(new Set([...remoteTargets, ...localTargets]));
}
