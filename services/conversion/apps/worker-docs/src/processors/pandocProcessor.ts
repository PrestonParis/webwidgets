import { access, readFile, writeFile } from 'node:fs/promises';
import type { ConversionJob } from '@webwidgets/conversion-shared';
import { env } from '../env.js';
import { runCommand } from '../lib/runCommand.js';

const pandocTargets: Record<string, string> = {
  html: 'html',
  md: 'gfm',
  txt: 'plain',
  pdf: 'pdf',
  epub: 'epub'
};

export async function convertWithPandoc(
  job: ConversionJob,
  inputPath: string,
  outputPath: string,
  workDir: string
) {
  const toFormat = pandocTargets[job.targetExtension];
  if (!toFormat) {
    throw new Error(`Pandoc output format is not configured for ${job.targetExtension}.`);
  }

  const args = [inputPath, '--to', toFormat, '--output', outputPath];
  if (job.targetExtension === 'html') {
    args.splice(1, 0, '--standalone');
  }

  try {
    // TODO: HTML input is not sanitized before Pandoc conversion. Pandoc does
    // not execute scripts, but untrusted HTML should still pass through a
    // sanitizer before richer preview/display paths use the result.
    await runCommand('pandoc', args, {
      cwd: workDir,
      timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS
    });
  } catch (error) {
    const message = errorMessage(error);
    if (isMissingCommand(error)) {
      if (job.sourceExtension === 'md' && job.targetExtension === 'html') {
        const markdown = await readFile(inputPath, 'utf8');
        await writeFile(outputPath, renderMarkdownFallback(markdown), 'utf8');
        return outputPath;
      }
      throw new Error('Pandoc conversion failed because Pandoc is not installed.');
    }
    if (job.targetExtension === 'pdf' && looksLikeMissingPdfToolchain(message)) {
      throw new Error(
        'Pandoc PDF conversion failed because a LaTeX PDF engine is missing. Install pdflatex, lualatex, or xelatex, or convert to HTML instead.'
      );
    }
    throw new Error(`Pandoc conversion failed: ${message}`);
  }

  if (!(await exists(outputPath))) {
    throw new Error(`Pandoc conversion completed but no ${job.targetExtension.toUpperCase()} output was found.`);
  }
  return outputPath;
}

function looksLikeMissingPdfToolchain(message: string) {
  const lower = message.toLowerCase();
  return lower.includes('pdflatex not found') ||
    lower.includes('xelatex not found') ||
    lower.includes('lualatex not found') ||
    lower.includes('context not found') ||
    lower.includes('pdf engine') ||
    lower.includes('latex');
}

function isMissingCommand(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT';
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown converter error.';
}

function renderMarkdownFallback(markdown: string) {
  const escaped = markdown
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const body = escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replaceAll('\n', '<br>')}</p>`)
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
}
