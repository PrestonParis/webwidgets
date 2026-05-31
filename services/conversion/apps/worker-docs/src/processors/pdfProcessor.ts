import { access, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ConversionJob } from '@webwidgets/conversion-shared';
import { env } from '../env.js';
import { runCommand } from '../lib/runCommand.js';

async function exists(filePath: string) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

function isMissingCommand(error: unknown) {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
    );
}

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * pdf → txt  using pdftotext (poppler-utils).
 *
 * Flags used:
 *   -layout   preserve approximate page layout
 *   -enc UTF-8
 *
 * For pdf → md, we run the same extraction and wrap the result in a minimal
 * Markdown document (heading + body). No structural inference is attempted;
 * the goal is clean plain text suitable for AI ingestion.
 */
export async function convertWithPdfToText(
    job: ConversionJob,
    inputPath: string,
    outputPath: string,
): Promise<string> {
    // Extract to a temporary .txt path, then optionally wrap for markdown
    const txtPath = outputPath.replace(/\.md$/, '.txt');

    try {
        await runCommand(
            'pdftotext',
            ['-layout', '-enc', 'UTF-8', inputPath, txtPath],
            { timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS },
        );
    } catch (error) {
        if (isMissingCommand(error)) {
            throw new Error(
                'pdftotext is not installed. Add poppler-utils to the worker-docs Dockerfile.',
            );
        }
        throw new Error(`pdftotext failed: ${errorMessage(error)}`);
    }

    if (!(await exists(txtPath))) {
        throw new Error('pdftotext completed but produced no output file.');
    }

    if (job.targetExtension === 'txt') {
        return txtPath;
    }

    // pdf → md: wrap extracted text in a minimal Markdown document
    const rawText = await readFile(txtPath, 'utf8');
    const title = basename(job.originalFileName, extname(job.originalFileName));
    const md = `# ${title}\n\n${rawText.trim()}\n`;
    await writeFile(outputPath, md, 'utf8');
    return outputPath;
}

/**
 * pdf → html using pdftohtml (poppler-utils).
 *
 * Flags used:
 *   -noframes   single HTML file instead of frame set
 *   -nodrm      ignore DRM flags (they are not enforced by pdftohtml anyway)
 *   -enc UTF-8
 *
 * pdftohtml writes [basename]-html.html (or similar). We find it with a
 * readdir scan and move it to the expected outputPath.
 */
export async function convertWithPdfToHtml(
    job: ConversionJob,
    inputPath: string,
    outputPath: string,
    workDir: string,
): Promise<string> {
    const inputBase = basename(inputPath, extname(inputPath));

    try {
        await runCommand(
            'pdftohtml',
            [
                '-noframes',
                '-enc',
                'UTF-8',
                '-nodrm',
                inputPath,
                join(workDir, inputBase),
            ],
            { timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS },
        );
    } catch (error) {
        if (isMissingCommand(error)) {
            throw new Error(
                'pdftohtml is not installed. Add poppler-utils to the worker-docs Dockerfile.',
            );
        }
        throw new Error(`pdftohtml failed: ${errorMessage(error)}`);
    }

    // pdftohtml writes files like: [base].html, [base]s.html, [base]-html.html
    // depending on version. Find the first .html file in workDir.
    const files = await readdir(workDir);
    const htmlFile = files.find(
        (f) =>
            f.toLowerCase().endsWith('.html') &&
            f.toLowerCase().startsWith(inputBase.toLowerCase()),
    );

    if (!htmlFile) {
        throw new Error(
            'pdftohtml completed but produced no HTML output file.',
        );
    }

    const produced = join(workDir, htmlFile);
    if (produced !== outputPath) {
        const { rename } = await import('node:fs/promises');
        await rename(produced, outputPath);
    }

    return outputPath;
}

// LibreOffice output format tokens for PDF-sourced conversions.
const pdfImportTargetFormats: Record<string, string> = {
    docx: 'docx',
    odt: 'odt',
    rtf: 'rtf',
};

/**
 * pdf → docx / odt / rtf  via LibreOffice Draw PDF Import filter.
 *
 * LibreOffice's "Draw PDF Import" filter opens the PDF as an editable Draw
 * document (each page becomes a slide-like canvas of positioned text boxes and
 * shapes), then exports it to the requested office format.
 *
 * Fidelity caveats:
 * - Output is layout-based (text boxes), NOT reflowable prose.
 * - Complex or scanned PDFs may produce garbled or empty output.
 * - Tables, headers/footers, and footnotes are best-effort.
 *
 * This is the only no-external-API path to convert a PDF into an editable
 * office format at batch scale.
 */
export async function convertPdfToDoc(
    job: ConversionJob,
    inputPath: string,
    workDir: string,
): Promise<string> {
    const targetFormat = pdfImportTargetFormats[job.targetExtension];
    if (!targetFormat) {
        throw new Error(
            `PDF-to-office conversion is not configured for target: ${job.targetExtension}.`,
        );
    }

    const profileDir = await mkdtemp(join(tmpdir(), `lo-pdf-${job.id}-`));
    const userInstallation = `-env:UserInstallation=${pathToFileURL(profileDir).href}`;

    try {
        await runCommand(
            'libreoffice',
            [
                userInstallation,
                '--headless',
                '--infilter=Draw PDF Import',
                '--convert-to',
                targetFormat,
                '--outdir',
                workDir,
                inputPath,
            ],
            { cwd: workDir, timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS },
        );
    } catch (error) {
        if (isMissingCommand(error)) {
            throw new Error(
                'LibreOffice is not installed. Add libreoffice to the worker-docs Dockerfile.',
            );
        }
        throw new Error(
            `LibreOffice PDF import failed: ${errorMessage(error)}`,
        );
    } finally {
        await rm(profileDir, { recursive: true, force: true });
    }

    // LibreOffice names the output file after the input base name.
    const inputBase = basename(inputPath, extname(inputPath));
    const expectedPath = join(workDir, `${inputBase}.${job.targetExtension}`);
    if (await exists(expectedPath)) return expectedPath;

    // Fallback: scan workDir for any file with the right extension.
    const files = await readdir(workDir);
    const found = files.find((f) =>
        f.toLowerCase().endsWith(`.${job.targetExtension}`),
    );
    if (!found) {
        throw new Error(
            `LibreOffice PDF import completed but no ${job.targetExtension.toUpperCase()} output was found.`,
        );
    }
    return join(workDir, found);
}

/**
 * pdf → png / jpg  via pdftoppm (poppler-utils).
 *
 * Converts the first page only. pdftoppm writes numbered files like
 * [prefix]-1.png (or [prefix]-01.png with zero-padding for multi-page PDFs).
 * We scan for the lowest-numbered output and rename it to outputPath.
 *
 * Flags used:
 *   -r 150     render at 150 DPI (good balance of size vs. quality)
 *   -png / -jpeg  target format
 *   -f 1 -l 1  first page only
 */
export async function convertPdfToImage(
    job: ConversionJob,
    inputPath: string,
    outputPath: string,
    workDir: string,
): Promise<string> {
    const isPng = job.targetExtension === 'png';
    const prefix = join(workDir, 'page');
    const formatFlag = isPng ? '-png' : '-jpeg';

    try {
        await runCommand(
            'pdftoppm',
            [formatFlag, '-r', '150', '-f', '1', '-l', '1', inputPath, prefix],
            { timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS },
        );
    } catch (error) {
        if (isMissingCommand(error)) {
            throw new Error(
                'pdftoppm is not installed. Add poppler-utils to the worker-docs Dockerfile.',
            );
        }
        throw new Error(`pdftoppm failed: ${errorMessage(error)}`);
    }

    // pdftoppm produces files like page-1.png or page-01.png depending on
    // total page count. Find the first matching file in workDir.
    const ext = isPng ? '.png' : '.jpg';
    const files = await readdir(workDir);
    const produced = files.find((f) => f.startsWith('page') && f.endsWith(ext));

    if (!produced) {
        throw new Error(
            `pdftoppm completed but no ${ext.slice(1).toUpperCase()} output was found.`,
        );
    }

    const producedPath = join(workDir, produced);
    if (producedPath !== outputPath) {
        const { rename } = await import('node:fs/promises');
        await rename(producedPath, outputPath);
    }
    return outputPath;
}

/**
 * pdf → epub  via two steps:
 *   1. pdftotext (poppler-utils) extracts the text layer.
 *   2. Pandoc wraps the extracted text as an EPUB document.
 *
 * Images, tables, and complex layout are not preserved. The result is clean
 * readable prose suitable for e-readers when the source PDF has a text layer.
 */
export async function convertPdfToEpub(
    job: ConversionJob,
    inputPath: string,
    outputPath: string,
): Promise<string> {
    const txtPath = outputPath.replace(/\.epub$/, '.txt');

    // Step 1: extract text layer
    try {
        await runCommand(
            'pdftotext',
            ['-layout', '-enc', 'UTF-8', inputPath, txtPath],
            { timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS },
        );
    } catch (error) {
        if (isMissingCommand(error)) {
            throw new Error(
                'pdftotext is not installed. Add poppler-utils to the worker-docs Dockerfile.',
            );
        }
        throw new Error(`pdftotext failed: ${errorMessage(error)}`);
    }

    if (!(await exists(txtPath))) {
        throw new Error('pdftotext completed but produced no output file.');
    }

    // Wrap plain text in minimal Markdown so Pandoc can assign a title.
    const rawText = await readFile(txtPath, 'utf8');
    const title = basename(job.originalFileName, extname(job.originalFileName));
    const mdPath = outputPath.replace(/\.epub$/, '-extracted.md');
    await writeFile(mdPath, `# ${title}\n\n${rawText.trim()}\n`, 'utf8');

    // Step 2: Pandoc → EPUB
    try {
        await runCommand(
            'pandoc',
            [
                mdPath,
                '--to',
                'epub',
                '--output',
                outputPath,
                `--metadata=title:${title}`,
            ],
            { timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS },
        );
    } catch (error) {
        if (isMissingCommand(error)) {
            throw new Error(
                'Pandoc is not installed. Add pandoc to the worker-docs Dockerfile.',
            );
        }
        throw new Error(
            `Pandoc EPUB conversion failed: ${errorMessage(error)}`,
        );
    }

    if (!(await exists(outputPath))) {
        throw new Error('Pandoc completed but produced no EPUB output.');
    }
    return outputPath;
}
