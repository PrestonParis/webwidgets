import { copyFile } from 'node:fs/promises';
import type { ConversionJob } from '@webwidgets/conversion-shared';

export async function convertWithNativeText(
    job: ConversionJob,
    inputPath: string,
    outputPath: string,
) {
    // txt → md: plain text is valid Markdown, copy unchanged
    if (job.sourceExtension === 'txt' && job.targetExtension === 'md') {
        await copyFile(inputPath, outputPath);
        return outputPath;
    }

    // csv → txt: CSV is valid plain text, copy unchanged
    if (job.sourceExtension === 'csv' && job.targetExtension === 'txt') {
        await copyFile(inputPath, outputPath);
        return outputPath;
    }

    throw new Error(
        `No native text converter for ${job.sourceExtension} to ${job.targetExtension}.`,
    );
}
