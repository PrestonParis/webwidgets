import { stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';
import { fileTypeFromFile } from 'file-type';
import type { ConversionJob } from '@webwidgets/conversion-shared';
import { env } from '../env.js';
import { downloadObject, uploadObject } from '../services/storage.js';
import { withTempDir } from '../lib/tempFiles.js';

function normalizeExt(ext: string): string {
  return ext === 'jpeg' ? 'jpg' : ext.toLowerCase();
}

// Expected MIME types per source extension (for byte-level sniffing).
// Keys are normalized (no 'jpeg').
const EXPECTED_MIMES: Record<string, string[]> = {
  png:  ['image/png'],
  jpg:  ['image/jpeg'],
  webp: ['image/webp'],
  gif:  ['image/gif'],
  tiff: ['image/tiff'],
  bmp:  ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'],
  svg:  ['image/svg+xml'],
};

const OUTPUT_CONTENT_TYPES: Record<string, string> = {
  png:  'image/png',
  jpg:  'image/jpeg',
  webp: 'image/webp',
};

export async function processImageJob(
  job: ConversionJob
): Promise<{ outputObjectKey: string; outputSizeBytes: number }> {
  return withTempDir(`image-${job.id}`, async (workDir) => {
    const inputPath = join(workDir, basename(job.originalFileName));
    await downloadObject(job.inputObjectKey, inputPath);

    // Byte-level MIME sniff — rejects mismatched or corrupted input.
    const detected = await fileTypeFromFile(inputPath);
    if (detected) {
      const srcExt = normalizeExt(job.sourceExtension);
      const expected = EXPECTED_MIMES[srcExt];
      if (expected && !expected.includes(detected.mime)) {
        throw new Error(
          `MIME mismatch: declared ${job.sourceExtension} but detected ${detected.mime}`
        );
      }
    }

    const tgtExt = normalizeExt(job.targetExtension);
    const srcBase = basename(job.originalFileName, extname(job.originalFileName));
    const outputPath = join(workDir, `${srcBase}.${tgtExt}`);

    await convertImage(normalizeExt(job.sourceExtension), tgtExt, inputPath, outputPath);

    const { size: outputSizeBytes } = await stat(outputPath);
    if (outputSizeBytes > env.IMAGE_MAX_OUTPUT_BYTES) {
      throw new Error(
        `Output too large: ${outputSizeBytes} bytes exceeds ${env.IMAGE_MAX_OUTPUT_BYTES}`
      );
    }

    const outputObjectKey = `outputs/${job.id}/${srcBase}.${tgtExt}`;
    const contentType = OUTPUT_CONTENT_TYPES[tgtExt] ?? 'application/octet-stream';
    await uploadObject(outputObjectKey, outputPath, contentType);

    return { outputObjectKey, outputSizeBytes };
  });
}

async function convertImage(
  srcExt: string,
  tgtExt: string,
  inputPath: string,
  outputPath: string
): Promise<void> {
  // animated=true only for gif→webp to preserve animation
  const animated = srcExt === 'gif' && tgtExt === 'webp';
  const instance = sharp(inputPath, { animated });

  // Metadata is stripped by default (sharp does not call .withMetadata()).
  // Set IMAGE_PRESERVE_METADATA=true to retain EXIF/ICC.
  if (env.IMAGE_PRESERVE_METADATA) {
    instance.withMetadata();
  }

  switch (tgtExt) {
    case 'jpg':
      // Flatten transparency onto white before JPEG encoding (JPEG has no alpha channel).
      await instance.flatten({ background: '#ffffff' }).jpeg({ quality: env.IMAGE_JPEG_QUALITY }).toFile(outputPath);
      break;
    case 'png':
      await instance.png().toFile(outputPath);
      break;
    case 'webp':
      await instance.webp({ quality: env.IMAGE_WEBP_QUALITY }).toFile(outputPath);
      break;
    default:
      throw new Error(`No image converter for ${srcExt} to ${tgtExt}.`);
  }
}
