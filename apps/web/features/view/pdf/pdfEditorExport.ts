import {
    degrees,
    PDFDocument,
    rgb,
    StandardFonts,
    type PDFPage,
} from 'pdf-lib';
import type { ViewAnnotation } from '@/features/view/schemas/objectSchemas';
import {
    applyNativePdfTextReplacements,
    type NativePdfTextReplacement,
} from '@/features/view/pdf/pdfContentStreamEditor';

type PdfEditorExportInput = {
    sourceUrl: string;
    fileName: string;
    annotations: ViewAnnotation[];
};

type PageGeometry = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export async function exportEditedPdf({
    sourceUrl,
    fileName,
    annotations,
}: PdfEditorExportInput) {
    const sourceBytes = await fetch(sourceUrl).then((response) => {
        if (!response.ok) throw new Error('Could not load the source PDF.');
        return response.arrayBuffer();
    });
    const pdfDoc = await PDFDocument.load(sourceBytes);
    const nativeTextReplacements = findNativeTextReplacements(annotations);
    const nativeTextReplacementResults = applyNativePdfTextReplacements(
        pdfDoc,
        nativeTextReplacements,
    );
    const nativelyAppliedAnnotationIds = new Set(
        nativeTextReplacementResults
            .filter((result) => result.applied)
            .flatMap((result) => [result.whiteoutId, result.textId]),
    );
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const annotation of annotations) {
        if (nativelyAppliedAnnotationIds.has(annotation.id)) continue;
        const pageNumber = Math.max(
            1,
            Math.floor(annotation.geometry?.page ?? 1),
        );
        if (pageNumber > pdfDoc.getPageCount()) continue;
        const page = pdfDoc.getPage(pageNumber - 1);
        const geometry = toPageGeometry(page, annotation.geometry);

        if (annotation.kind === 'text') {
            page.drawText(annotation.text ?? '', {
                x: geometry.x + 4,
                y: geometry.y + geometry.height - 14,
                size: Math.max(8, Math.min(14, geometry.height * 0.35)),
                font,
                color: rgb(0.05, 0.07, 0.1),
                maxWidth: Math.max(12, geometry.width - 8),
                lineHeight: 12,
            });
        } else if (annotation.kind === 'highlight') {
            page.drawRectangle({
                ...geometry,
                color: rgb(0.99, 0.87, 0.25),
                opacity: 0.42,
            });
        } else if (annotation.kind === 'redaction') {
            const isWhiteout = annotation.color?.toLowerCase() === '#ffffff';
            page.drawRectangle({
                ...geometry,
                color: isWhiteout ? rgb(1, 1, 1) : rgb(0.02, 0.02, 0.03),
                opacity: 1,
            });
        } else if (annotation.kind === 'signature' && annotation.text) {
            const image = await embedSignatureImage(pdfDoc, annotation.text);
            if (!image) continue;
            page.drawImage(image, {
                ...geometry,
                rotate: degrees(0),
            });
        }
    }

    const editedBytes = await pdfDoc.save();
    downloadBytes(editedBytes, editedFileName(fileName));
}

function findNativeTextReplacements(
    annotations: ViewAnnotation[],
): NativePdfTextReplacement[] {
    const whiteouts = annotations.filter(
        (annotation) =>
            annotation.kind === 'redaction' &&
            annotation.color?.toLowerCase() === '#ffffff' &&
            Boolean(annotation.text?.trim()),
    );
    const replacements: NativePdfTextReplacement[] = [];

    for (const whiteout of whiteouts) {
        const replacementText = annotations.find(
            (annotation) =>
                annotation.kind === 'text' &&
                annotation.id !== whiteout.id &&
                sameGeometry(annotation.geometry, whiteout.geometry),
        );
        if (!replacementText?.text?.trim() || !whiteout.text?.trim()) continue;

        replacements.push({
            whiteoutId: whiteout.id,
            textId: replacementText.id,
            pageNumber: Math.max(1, Math.floor(whiteout.geometry?.page ?? 1)),
            originalText: whiteout.text,
            replacementText: replacementText.text,
        });
    }

    return replacements;
}

function sameGeometry(
    left: ViewAnnotation['geometry'],
    right: ViewAnnotation['geometry'],
) {
    if (!left || !right) return false;
    return (
        Math.floor(left.page ?? 1) === Math.floor(right.page ?? 1) &&
        nearlyEqual(left.x, right.x) &&
        nearlyEqual(left.y, right.y) &&
        nearlyEqual(left.width, right.width) &&
        nearlyEqual(left.height, right.height)
    );
}

function nearlyEqual(left = 0, right = 0) {
    return Math.abs(left - right) < 0.01;
}

function toPageGeometry(
    page: PDFPage,
    geometry: ViewAnnotation['geometry'],
): PageGeometry {
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const xPct = geometry?.x ?? 0;
    const yPct = geometry?.y ?? 0;
    const wPct = geometry?.width ?? 20;
    const hPct = geometry?.height ?? 6;
    const width = (wPct / 100) * pageWidth;
    const height = (hPct / 100) * pageHeight;

    return {
        x: (xPct / 100) * pageWidth,
        y: pageHeight - (yPct / 100) * pageHeight - height,
        width,
        height,
    };
}

async function embedSignatureImage(pdfDoc: PDFDocument, dataUrl: string) {
    const bytes = dataUrlToBytes(dataUrl);
    if (!bytes) return null;
    if (dataUrl.startsWith('data:image/png')) return pdfDoc.embedPng(bytes);
    if (
        dataUrl.startsWith('data:image/jpeg') ||
        dataUrl.startsWith('data:image/jpg')
    ) {
        return pdfDoc.embedJpg(bytes);
    }
    return null;
}

function dataUrlToBytes(dataUrl: string) {
    const [, encoded] = dataUrl.split(',');
    if (!encoded) return null;
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function downloadBytes(bytes: Uint8Array, fileName: string) {
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    const blob = new Blob([copy as unknown as BlobPart], {
        type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

function editedFileName(fileName: string) {
    const base = fileName.replace(/\.pdf$/i, '') || 'document';
    return `${base}-edited.pdf`;
}
