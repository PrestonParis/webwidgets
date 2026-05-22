import { copyFile } from 'node:fs/promises';
import type { ConversionJob } from '@webwidgets/conversion-shared';

export async function convertWithNativeText(
  job: ConversionJob,
  inputPath: string,
  outputPath: string
) {
  if (job.sourceExtension === 'txt' && job.targetExtension === 'md') {
    await copyFile(inputPath, outputPath);
    return outputPath;
  }

  throw new Error(`No native text converter for ${job.sourceExtension} to ${job.targetExtension}.`);
}
