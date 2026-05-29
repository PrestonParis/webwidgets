import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
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
