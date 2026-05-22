import type { ConversionJob } from '@webwidgets/conversion-shared';
import { convertWithLibreOffice } from './libreOfficeProcessor.js';

export async function convertSpreadsheetWithLibreOffice(
  job: ConversionJob,
  inputPath: string,
  workDir: string
) {
  if (job.sourceExtension === 'xlsx' && job.targetExtension === 'csv') {
    // LibreOffice CLI exports a single CSV from the active/first sheet. TODO:
    // add multi-sheet export as a ZIP of per-sheet CSV files if product needs it.
    return convertWithLibreOffice(job, inputPath, workDir);
  }

  return convertWithLibreOffice(job, inputPath, workDir);
}
