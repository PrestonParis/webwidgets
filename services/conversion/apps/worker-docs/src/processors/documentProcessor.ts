import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
    findSupportedConversion,
    getConversionEngine,
    normalizeExtension,
    type ConversionJob,
} from '@webwidgets/conversion-shared';
import { env } from '../env.js';
import { downloadObject, uploadObject } from '../services/storage.js';
import { convertWithLibreOffice } from './libreOfficeProcessor.js';
import { convertWithPandoc } from './pandocProcessor.js';
import { convertSpreadsheetWithLibreOffice } from './spreadsheetProcessor.js';
import { convertWithNativeText } from './textProcessor.js';
import { convertWithPdfToText, convertWithPdfToHtml } from './pdfProcessor.js';

const execFileAsync = promisify(execFile);

const CONTENT_TYPES: Record<string, string> = {
    pdf: 'application/pdf',
    html: 'text/html; charset=utf-8',
    md: 'text/markdown; charset=utf-8',
    txt: 'text/plain; charset=utf-8',
    csv: 'text/csv; charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    epub: 'application/epub+zip',
    svg: 'image/svg+xml',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    odt: 'application/vnd.oasis.opendocument.text',
    rtf: 'application/rtf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const EXPECTED_MIMES: Partial<Record<string, string[]>> = {
    doc: ['application/msword', 'application/octet-stream'],
    docx: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/octet-stream',
    ],
    odt: ['application/vnd.oasis.opendocument.text', 'application/zip'],
    rtf: ['application/rtf', 'text/rtf', 'text/plain'],
    txt: ['text/plain', 'application/octet-stream'],
    html: ['text/html', 'text/plain', 'application/xhtml+xml'],
    md: ['text/plain', 'text/markdown', 'text/x-markdown'],
    ppt: ['application/vnd.ms-powerpoint', 'application/octet-stream'],
    pptx: [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/octet-stream',
    ],
    odp: ['application/vnd.oasis.opendocument.presentation', 'application/zip'],
    xls: ['application/vnd.ms-excel', 'application/octet-stream'],
    xlsx: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/octet-stream',
    ],
    ods: ['application/vnd.oasis.opendocument.spreadsheet', 'application/zip'],
    csv: [
        'text/csv',
        'text/plain',
        'application/csv',
        'application/vnd.ms-excel',
    ],
    epub: ['application/epub+zip', 'application/zip'],
    svg: ['image/svg+xml', 'text/xml', 'application/xml', 'text/plain'],
    pdf: ['application/pdf'],
};

async function sniffMime(filePath: string): Promise<string | null> {
    try {
        const { stdout } = await execFileAsync('file', [
            '--brief',
            '--mime-type',
            filePath,
        ]);
        return stdout.trim() || null;
    } catch (err: unknown) {
        if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as NodeJS.ErrnoException).code === 'ENOENT'
        ) {
            return null;
        }
        throw err;
    }
}

export async function processDocumentJob(
    job: ConversionJob,
): Promise<{ outputObjectKey: string; outputSizeBytes: number }> {
    const workDir = await mkdtemp(join(tmpdir(), `conversion-${job.id}-`));
    await mkdir(workDir, { recursive: true });

    const normalizedJob = {
        ...job,
        sourceExtension: normalizeExtension(job.sourceExtension),
        targetExtension: normalizeExtension(job.targetExtension),
    } as ConversionJob;

    try {
        const inputPath = join(
            workDir,
            basename(normalizedJob.originalFileName),
        );
        await downloadObject(normalizedJob.inputObjectKey, inputPath);
        await assertInputMime(normalizedJob, inputPath);

        const outputPath = await convertDocument(
            normalizedJob,
            inputPath,
            workDir,
        );

        const { size: outputSizeBytes } = await stat(outputPath);
        if (outputSizeBytes > env.CONVERSION_MAX_OUTPUT_BYTES) {
            throw new Error(
                `Output file too large: ${outputSizeBytes} bytes exceeds limit of ${env.CONVERSION_MAX_OUTPUT_BYTES} bytes`,
            );
        }

        const outputObjectKey = `outputs/${normalizedJob.id}/${outputFileName(normalizedJob)}`;
        await uploadObject(
            outputObjectKey,
            outputPath,
            CONTENT_TYPES[normalizedJob.targetExtension] ??
                'application/octet-stream',
        );
        return { outputObjectKey, outputSizeBytes };
    } finally {
        await rm(workDir, { recursive: true, force: true });
    }
}

async function assertInputMime(job: ConversionJob, inputPath: string) {
    const sniffedInputMime = await sniffMime(inputPath);
    if (!sniffedInputMime) return;

    const expected = EXPECTED_MIMES[job.sourceExtension];
    if (
        expected &&
        !expected.some((m) =>
            sniffedInputMime.startsWith((m.split(';')[0] ?? m).trim()),
        )
    ) {
        throw new Error(
            `MIME mismatch: declared ${job.sourceExtension} but file is ${sniffedInputMime}`,
        );
    }
}

async function convertDocument(
    job: ConversionJob,
    inputPath: string,
    workDir: string,
) {
    const conversion = findSupportedConversion(
        job.sourceExtension,
        job.targetExtension,
    );
    if (!conversion) {
        throw new Error(
            `No document converter for ${job.sourceExtension} to ${job.targetExtension}.`,
        );
    }

    const outputPath = join(workDir, outputFileName(job));
    const engine = getConversionEngine(
        job.sourceExtension,
        job.targetExtension,
    );

    if (engine === 'pandoc') {
        return convertWithPandoc(job, inputPath, outputPath, workDir);
    }

    if (engine === 'native') {
        return convertWithNativeText(job, inputPath, outputPath);
    }

    if (engine === 'pdftotext') {
        return convertWithPdfToText(job, inputPath, outputPath);
    }

    if (engine === 'pdftohtml') {
        return convertWithPdfToHtml(job, inputPath, outputPath, workDir);
    }

    if (engine === 'libreoffice') {
        if (isSpreadsheetRoute(job)) {
            return convertSpreadsheetWithLibreOffice(job, inputPath, workDir);
        }
        return convertWithLibreOffice(job, inputPath, workDir);
    }

    throw new Error(
        `No engine configured for ${job.sourceExtension} to ${job.targetExtension}.`,
    );
}

function isSpreadsheetRoute(job: ConversionJob) {
    const spreadsheetFormats = ['xls', 'xlsx', 'ods', 'csv'];
    // Route to spreadsheet processor only when the target is a spreadsheet format
    // or when converting between spreadsheet formats. txt/html/pdf from spreadsheets
    // use the standard LibreOffice processor with text/html/pdf output format.
    return (
        spreadsheetFormats.includes(job.sourceExtension) &&
        spreadsheetFormats.includes(job.targetExtension)
    );
}

function outputFileName(job: ConversionJob) {
    const base = job.originalFileName.replace(/\.[^.]+$/, '');
    return `${base}.${job.targetExtension}`;
}
