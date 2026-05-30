import net from 'node:net';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { fileTypeFromFile } from 'file-type';
import { getConversionKind } from '../../packages/shared/src/conversionMatrix.js';
import { assertJobAllowed } from '../../apps/api/src/lib/filePolicy.js';
import { HttpError } from '../../apps/api/src/lib/errors.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, '..', 'fixtures');

// Quick TCP probe — avoids hanging on Redis/Postgres when the stack isn't running.
function tcpReachable(
    port: number,
    host = '127.0.0.1',
    timeoutMs = 1500,
): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('error', () => resolve(false));
        socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

async function infraRunning(): Promise<boolean> {
    const [pg, redis] = await Promise.all([
        tcpReachable(5433),
        tcpReachable(6380),
    ]);
    return pg && redis;
}

// ---------------------------------------------------------------------------
// beforeAll: generate fixture images
// ---------------------------------------------------------------------------

beforeAll(async () => {
    await mkdir(fixturesDir, { recursive: true });

    // 10×10 opaque red PNG
    await sharp({
        create: {
            width: 10,
            height: 10,
            channels: 3,
            background: { r: 255, g: 0, b: 0 },
        },
    })
        .png()
        .toFile(join(fixturesDir, 'sample.png'));

    // 10×10 blue JPEG
    await sharp({
        create: {
            width: 10,
            height: 10,
            channels: 3,
            background: { r: 0, g: 0, b: 255 },
        },
    })
        .jpeg({ quality: 90 })
        .toFile(join(fixturesDir, 'sample.jpg'));

    // 10×10 green WebP
    await sharp({
        create: {
            width: 10,
            height: 10,
            channels: 3,
            background: { r: 0, g: 255, b: 0 },
        },
    })
        .webp()
        .toFile(join(fixturesDir, 'sample.webp'));

    // Minimal 1×1 transparent animated GIF (base64 encoded)
    const gifBase64 =
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==';
    await writeFile(
        join(fixturesDir, 'sample.gif'),
        Buffer.from(gifBase64, 'base64'),
    );

    // 10×10 TIFF
    await sharp({
        create: {
            width: 10,
            height: 10,
            channels: 3,
            background: { r: 128, g: 64, b: 32 },
        },
    })
        .tiff()
        .toFile(join(fixturesDir, 'sample.tiff'));

    // SVG text file
    await writeFile(
        join(fixturesDir, 'sample.svg'),
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>',
        'utf8',
    );

    // Minimal 2×2 24-bit BMP (hardcoded — sharp cannot write BMP)
    // BMP header (54 bytes) + pixel data (16 bytes, BGRBGR... row-padded to 8 bytes per row)
    const bmpBuffer = Buffer.from([
        // BMP file header (14 bytes)
        0x42,
        0x4d, // Signature 'BM'
        0x46,
        0x00,
        0x00,
        0x00, // File size: 70 bytes (14 + 40 + 16)
        0x00,
        0x00, // Reserved
        0x00,
        0x00, // Reserved
        0x36,
        0x00,
        0x00,
        0x00, // Pixel data offset: 54
        // DIB header (40 bytes)
        0x28,
        0x00,
        0x00,
        0x00, // DIB header size: 40
        0x02,
        0x00,
        0x00,
        0x00, // Width: 2
        0x02,
        0x00,
        0x00,
        0x00, // Height: 2
        0x01,
        0x00, // Color planes: 1
        0x18,
        0x00, // Bits per pixel: 24
        0x00,
        0x00,
        0x00,
        0x00, // Compression: none (BI_RGB)
        0x10,
        0x00,
        0x00,
        0x00, // Image size: 16 bytes
        0x13,
        0x0b,
        0x00,
        0x00, // X pixels per meter
        0x13,
        0x0b,
        0x00,
        0x00, // Y pixels per meter
        0x00,
        0x00,
        0x00,
        0x00, // Colors in color table
        0x00,
        0x00,
        0x00,
        0x00, // Important color count
        // Pixel data: 2 rows × 8 bytes (3 bytes per pixel × 2 pixels + 2 bytes padding)
        // Row 0 (bottom): red, red
        0x00,
        0x00,
        0xff, // red pixel (BGR)
        0x00,
        0x00,
        0xff, // red pixel (BGR)
        0x00,
        0x00, // padding
        // Row 1 (top): red, red
        0x00,
        0x00,
        0xff, // red pixel (BGR)
        0x00,
        0x00,
        0xff, // red pixel (BGR)
        0x00,
        0x00, // padding
    ]);
    await writeFile(join(fixturesDir, 'sample.bmp'), bmpBuffer);
});

// ---------------------------------------------------------------------------
// Group 1: Conversion kind routing (no infra)
// ---------------------------------------------------------------------------

describe('Conversion kind routing (no infra)', () => {
    it('png → jpg is image kind', () => {
        expect(getConversionKind('png', 'jpg')).toBe('image');
    });

    it('md → pdf is document kind', () => {
        expect(getConversionKind('md', 'pdf')).toBe('document');
    });

    it('jpg → webp is image kind', () => {
        expect(getConversionKind('jpg', 'webp')).toBe('image');
    });

    it('unknown pair defaults to document', () => {
        expect(getConversionKind('foo', 'bar')).toBe('document');
    });
});

// ---------------------------------------------------------------------------
// Group 2: Image job validation (no infra)
// ---------------------------------------------------------------------------

describe('Image job validation (no infra)', () => {
    it('accepts png → jpg with image/png MIME', () => {
        expect(() =>
            assertJobAllowed({
                originalFileName: 'photo.png',
                sourceMime: 'image/png',
                sourceExtension: 'png',
                targetExtension: 'jpg',
                fileSizeBytes: 1024,
            }),
        ).not.toThrow();
    });

    it('accepts jpg → webp with image/jpeg MIME', () => {
        expect(() =>
            assertJobAllowed({
                originalFileName: 'photo.jpg',
                sourceMime: 'image/jpeg',
                sourceExtension: 'jpg',
                targetExtension: 'webp',
                fileSizeBytes: 2048,
            }),
        ).not.toThrow();
    });

    it('rejects oversized image', () => {
        expect(() =>
            assertJobAllowed({
                originalFileName: 'big.png',
                sourceMime: 'image/png',
                sourceExtension: 'png',
                targetExtension: 'jpg',
                fileSizeBytes: 9_999_999_999,
            }),
        ).toThrow(HttpError);
    });

    it('rejects unsupported pair (png → docx)', () => {
        expect(() =>
            assertJobAllowed({
                originalFileName: 'photo.png',
                sourceMime: 'image/png',
                sourceExtension: 'png',
                targetExtension: 'docx' as 'pdf',
                fileSizeBytes: 1024,
            }),
        ).toThrow(HttpError);
    });
});

// ---------------------------------------------------------------------------
// Group 3: Image processor (mocked S3)
// ---------------------------------------------------------------------------

describe('Image processor (mocked S3)', () => {
    // We reset modules per test to allow fresh env mocking where needed.
    // The storage mock must copy the fixture to the destination path.

    async function runProcessor(
        fixtureFile: string,
        sourceExtension: string,
        targetExtension: string,
    ): Promise<{
        outputPath: string;
        uploadedKey: string;
        uploadedContentType: string;
    }> {
        let capturedOutputPath = '';
        let capturedKey = '';
        let capturedContentType = '';

        vi.doMock('../../apps/worker-images/src/services/storage.js', () => ({
            downloadObject: async (_key: string, destPath: string) => {
                await copyFile(join(fixturesDir, fixtureFile), destPath);
            },
            uploadObject: async (
                key: string,
                srcPath: string,
                contentType: string,
            ) => {
                capturedOutputPath = srcPath;
                capturedKey = key;
                capturedContentType = contentType;
            },
        }));

        const { processImageJob } =
            await import('../../apps/worker-images/src/processors/imageProcessor.js');

        const job = {
            id: crypto.randomUUID(),
            status: 'processing' as const,
            kind: 'image' as const,
            originalFileName: fixtureFile,
            sourceMime: 'image/png',
            sourceExtension,
            targetExtension,
            fileSizeBytes: 100,
            inputObjectKey: `inputs/test/${fixtureFile}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await processImageJob(job);
        await vi.resetModules();

        return {
            outputPath: capturedOutputPath,
            uploadedKey: capturedKey,
            uploadedContentType: capturedContentType,
        };
    }

    it('png → jpg: produces JPEG content type', async () => {
        const { uploadedContentType } = await runProcessor(
            'sample.png',
            'png',
            'jpg',
        );
        expect(uploadedContentType).toBe('image/jpeg');
    });

    it('jpg → png: produces PNG content type', async () => {
        const { uploadedContentType } = await runProcessor(
            'sample.jpg',
            'jpg',
            'png',
        );
        expect(uploadedContentType).toBe('image/png');
    });

    it('png → webp: produces WebP content type', async () => {
        const { uploadedContentType } = await runProcessor(
            'sample.png',
            'png',
            'webp',
        );
        expect(uploadedContentType).toBe('image/webp');
    });

    it('webp → png: produces PNG content type', async () => {
        const { uploadedContentType } = await runProcessor(
            'sample.webp',
            'webp',
            'png',
        );
        expect(uploadedContentType).toBe('image/png');
    });

    it('svg → png: produces PNG content type', async () => {
        const { uploadedContentType } = await runProcessor(
            'sample.svg',
            'svg',
            'png',
        );
        expect(uploadedContentType).toBe('image/png');
    });

    it('transparent PNG → jpg flattens to opaque output (no alpha channel)', async () => {
        // Create a transparent PNG fixture for this test
        const transparentPng = join(fixturesDir, 'transparent.png');
        await sharp({
            create: {
                width: 10,
                height: 10,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 0 },
            },
        })
            .png()
            .toFile(transparentPng);

        // Capture the uploaded buffer before the temp dir is cleaned up.
        // We copy the output file to a stable location before processImageJob returns.
        const capturedOutputPath = join(fixturesDir, 'transparent_out.jpg');
        let uploadedContentType = '';

        vi.doMock('../../apps/worker-images/src/services/storage.js', () => ({
            downloadObject: async (_key: string, destPath: string) => {
                await copyFile(transparentPng, destPath);
            },
            uploadObject: async (_key: string, srcPath: string, ct: string) => {
                uploadedContentType = ct;
                // Copy output before withTempDir cleans it up
                await copyFile(srcPath, capturedOutputPath);
            },
        }));

        const { processImageJob } =
            await import('../../apps/worker-images/src/processors/imageProcessor.js');
        const job = {
            id: crypto.randomUUID(),
            status: 'processing' as const,
            kind: 'image' as const,
            originalFileName: 'transparent.png',
            sourceMime: 'image/png',
            sourceExtension: 'png',
            targetExtension: 'jpg',
            fileSizeBytes: 100,
            inputObjectKey: 'inputs/test/transparent.png',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await processImageJob(job);
        await vi.resetModules();

        // Content type should be JPEG
        expect(uploadedContentType).toBe('image/jpeg');

        // Verify output is a JPEG (no alpha channel in JPEG)
        const detected = await fileTypeFromFile(capturedOutputPath);
        expect(detected?.mime).toBe('image/jpeg');

        // Also verify the image has no alpha by reading metadata
        const meta = await sharp(capturedOutputPath).metadata();
        expect(meta.hasAlpha).toBeFalsy();
    });

    it('MIME mismatch: file content does not match declared extension → throws', async () => {
        // Use a PNG file but declare it as jpg
        vi.doMock('../../apps/worker-images/src/services/storage.js', () => ({
            downloadObject: async (_key: string, destPath: string) => {
                await copyFile(join(fixturesDir, 'sample.png'), destPath);
            },
            uploadObject: async () => {
                /* no-op */
            },
        }));

        const { processImageJob } =
            await import('../../apps/worker-images/src/processors/imageProcessor.js');
        const job = {
            id: crypto.randomUUID(),
            status: 'processing' as const,
            kind: 'image' as const,
            originalFileName: 'photo.jpg',
            sourceMime: 'image/jpeg',
            sourceExtension: 'jpg',
            targetExtension: 'png',
            fileSizeBytes: 100,
            inputObjectKey: 'inputs/test/photo.jpg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await expect(processImageJob(job)).rejects.toThrow(/MIME mismatch/i);
        await vi.resetModules();
    });

    it('output size cap: throws when output exceeds limit', async () => {
        vi.doMock('../../apps/worker-images/src/env.js', () => ({
            env: {
                DATABASE_URL: 'postgres://x:x@localhost:5433/x',
                REDIS_URL: 'redis://localhost:6380',
                S3_ENDPOINT: 'http://localhost:9000',
                S3_ACCESS_KEY_ID: 'minioadmin',
                S3_SECRET_ACCESS_KEY: 'minioadmin',
                S3_BUCKET: 'webwidgets-conversions',
                S3_FORCE_PATH_STYLE: true,
                IMAGE_WORKER_CONCURRENCY: 4,
                IMAGE_CONVERSION_TIMEOUT_MS: 60000,
                IMAGE_MAX_OUTPUT_BYTES: 1, // tiny limit — any output will exceed this
                IMAGE_JPEG_QUALITY: 90,
                IMAGE_WEBP_QUALITY: 85,
                IMAGE_PRESERVE_METADATA: false,
                WORKER_LOCK_DURATION_MS: 120000,
            },
        }));

        vi.doMock('../../apps/worker-images/src/services/storage.js', () => ({
            downloadObject: async (_key: string, destPath: string) => {
                await copyFile(join(fixturesDir, 'sample.png'), destPath);
            },
            uploadObject: async () => {
                /* no-op */
            },
        }));

        const { processImageJob } =
            await import('../../apps/worker-images/src/processors/imageProcessor.js');
        const job = {
            id: crypto.randomUUID(),
            status: 'processing' as const,
            kind: 'image' as const,
            originalFileName: 'sample.png',
            sourceMime: 'image/png',
            sourceExtension: 'png',
            targetExtension: 'jpg',
            fileSizeBytes: 100,
            inputObjectKey: 'inputs/test/sample.png',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await expect(processImageJob(job)).rejects.toThrow(/too large/i);
        await vi.resetModules();
    });
});

// ---------------------------------------------------------------------------
// Group 4: Image worker integration (requires infra)
// ---------------------------------------------------------------------------

describe('Image worker integration (requires infra)', () => {
    let infraAvailable = false;

    beforeAll(async () => {
        infraAvailable = await infraRunning();
        if (!infraAvailable) {
            console.log(
                '[image-smoke] Infra not running — skipping infra-dependent tests.',
            );
        }
    }, 5000);

    it('full round-trip png → jpg via HTTP (requires infra)', async (ctx) => {
        if (!infraAvailable) return ctx.skip();

        const { default: fetch } = await import('node:http').then(() =>
            // Use undici/fetch if available, otherwise skip
            Promise.resolve({ default: globalThis.fetch ?? null }),
        );
        if (!fetch) return ctx.skip();

        const pngBuffer = await readFile(join(fixturesDir, 'sample.png'));

        // 1. Create job
        const createRes = await fetch('http://localhost:4010/v1/jobs', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                originalFileName: 'sample.png',
                sourceMime: 'image/png',
                sourceExtension: 'png',
                targetExtension: 'jpg',
                fileSizeBytes: pngBuffer.byteLength,
            }),
        });
        expect(createRes.status).toBe(201);
        const { jobId, uploadUrl } = (await createRes.json()) as {
            jobId: string;
            uploadUrl: string;
        };
        expect(typeof jobId).toBe('string');

        // 2. Upload
        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'content-type': 'image/png' },
            body: pngBuffer,
        });
        expect(uploadRes.ok).toBe(true);

        // 3. Start
        const startRes = await fetch(
            `http://localhost:4010/v1/jobs/${jobId}/start`,
            { method: 'POST' },
        );
        expect(startRes.status).toBe(202);
    });
});
