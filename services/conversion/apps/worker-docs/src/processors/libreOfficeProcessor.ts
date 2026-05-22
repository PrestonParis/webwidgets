import { access, mkdtemp, readdir, rm } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import type { ConversionJob } from '@webwidgets/conversion-shared';
import { env } from '../env.js';
import { runCommand } from '../lib/runCommand.js';

const libreOfficeOutputFormats: Record<string, string> = {
  pdf: 'pdf',
  csv: 'csv',
  xlsx: 'xlsx'
};

export async function convertWithLibreOffice(
  job: ConversionJob,
  inputPath: string,
  workDir: string
) {
  const targetFormat = libreOfficeOutputFormats[job.targetExtension];
  if (!targetFormat) {
    throw new Error(`LibreOffice output format is not configured for ${job.targetExtension}.`);
  }

  const profileDir = await mkdtemp(join(tmpdir(), `lo-profile-${job.id}-`));
  const userInstallation = `-env:UserInstallation=${pathToFileURL(profileDir).href}`;

  try {
    try {
      await runCommand(
        'libreoffice',
        [
          userInstallation,
          '--headless',
          '--convert-to',
          targetFormat,
          '--outdir',
          workDir,
          inputPath
        ],
        {
          cwd: workDir,
          timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS
        }
      );
    } catch (error) {
      throw new Error(
        `LibreOffice conversion failed or LibreOffice is not installed: ${errorMessage(error)}`
      );
    }
  } finally {
    await rm(profileDir, { recursive: true, force: true });
  }

  const outputPath = await findLibreOfficeOutput(inputPath, workDir, job.targetExtension);
  if (!outputPath) {
    throw new Error(
      `LibreOffice conversion completed but no ${job.targetExtension.toUpperCase()} output was found.`
    );
  }
  return outputPath;
}

async function findLibreOfficeOutput(inputPath: string, workDir: string, targetExtension: string) {
  const inputBase = basename(inputPath, extname(inputPath));
  const expectedPath = join(workDir, `${inputBase}.${targetExtension}`);
  if (await exists(expectedPath)) return expectedPath;

  const files = await readdir(workDir);
  const matchingFile = files.find((file) => {
    const lower = file.toLowerCase();
    return lower === `${inputBase.toLowerCase()}.${targetExtension}` ||
      (basename(file, extname(file)).toLowerCase() === inputBase.toLowerCase() &&
        extname(file).toLowerCase() === `.${targetExtension}`);
  });
  return matchingFile ? join(workDir, matchingFile) : null;
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
