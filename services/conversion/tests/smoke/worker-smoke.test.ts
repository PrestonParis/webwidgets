import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest';
import type { ConversionJob } from '@webwidgets/conversion-shared';

const execFileAsync = promisify(execFile);
type DownloadObject =
    typeof import('../../apps/worker-docs/src/services/storage.js').downloadObject;
type UploadObject =
    typeof import('../../apps/worker-docs/src/services/storage.js').uploadObject;

// ---------------------------------------------------------------------------
// Mock S3 storage so the processor runs without a MinIO instance.
// The mock is registered before any test code runs (Vitest hoists vi.mock).
// ---------------------------------------------------------------------------

vi.mock('../../apps/worker-docs/src/services/storage.js', () => ({
    downloadObject: vi.fn(),
    uploadObject: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIXTURES = {
    md: new URL('../fixtures/sample.md', import.meta.url).pathname,
    txt: new URL('../fixtures/sample.txt', import.meta.url).pathname,
    html: new URL('../fixtures/sample.html', import.meta.url).pathname,
    csv: new URL('../fixtures/sample.csv', import.meta.url).pathname,
    rtf: new URL('../fixtures/sample.rtf', import.meta.url).pathname,
};

function makeJob(overrides: Partial<ConversionJob> = {}): ConversionJob {
    const id = crypto.randomUUID();
    return {
        id,
        status: 'processing',
        kind: 'document',
        originalFileName: 'sample.md',
        sourceMime: 'text/plain',
        sourceExtension: 'md',
        targetExtension: 'html',
        fileSizeBytes: 512,
        inputObjectKey: `inputs/${id}/sample.md`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

async function isPandocPdfAvailable(): Promise<boolean> {
    // Pandoc md→pdf requires a LaTeX engine (e.g. pdflatex or lualatex).
    // Run a tiny test conversion to check both pandoc and the engine are present.
    try {
        const { tmpdir } = await import('node:os');
        const { mkdtemp, writeFile: wf, rm } = await import('node:fs/promises');
        const dir = await mkdtemp(`${tmpdir()}/pandoc-check-`);
        try {
            await wf(`${dir}/t.md`, '# hi');
            await execFileAsync('pandoc', [
                `${dir}/t.md`,
                '-o',
                `${dir}/t.pdf`,
            ]);
            return true;
        } finally {
            await rm(dir, { recursive: true, force: true });
        }
    } catch {
        return false;
    }
}

async function isCommandAvailable(command: string): Promise<boolean> {
    try {
        await execFileAsync(command, ['--version']);
        return true;
    } catch {
        return false;
    }
}

async function isLibreOfficeAvailable(): Promise<boolean> {
    return isCommandAvailable('libreoffice');
}

async function isPandocAvailable(): Promise<boolean> {
    return isCommandAvailable('pandoc');
}

async function libreOfficeFixture(
    sourcePath: string,
    targetExtension: string,
): Promise<string | null> {
    const outdir = await mkdtemp(join(tmpdir(), 'lo-fixture-'));
    try {
        await execFileAsync('libreoffice', [
            '--headless',
            '--convert-to',
            targetExtension,
            '--outdir',
            outdir,
            sourcePath,
        ]);
        const outputPath = join(
            outdir,
            basename(sourcePath).replace(/\.[^.]+$/, `.${targetExtension}`),
        );
        await readFile(outputPath);
        return outputPath;
    } catch {
        await rm(outdir, { recursive: true, force: true });
        return null;
    }
}

async function pandocFixture(
    sourcePath: string,
    targetExtension: string,
): Promise<string | null> {
    const outdir = await mkdtemp(join(tmpdir(), 'pandoc-fixture-'));
    try {
        const outputPath = join(
            outdir,
            basename(sourcePath).replace(/\.[^.]+$/, `.${targetExtension}`),
        );
        await execFileAsync('pandoc', [sourcePath, '-o', outputPath]);
        await readFile(outputPath);
        return outputPath;
    } catch {
        await rm(outdir, { recursive: true, force: true });
        return null;
    }
}

// ---------------------------------------------------------------------------
// Processor unit tests — no S3, no Redis, no Postgres
// ---------------------------------------------------------------------------

describe('processDocumentJob (mocked S3)', () => {
    // Lazily imported so Vitest's mock for storage.js is already registered.
    // Each import inside `it()` works because the module cache is shared within
    // a single test file run.
    let processDocumentJob: (
        job: ConversionJob,
    ) => Promise<{ outputObjectKey: string; outputSizeBytes: number }>;
    let downloadObject: MockedFunction<DownloadObject>;
    let uploadObject: MockedFunction<UploadObject>;

    beforeEach(async () => {
        const processorMod =
            await import('../../apps/worker-docs/src/processors/documentProcessor.js');
        processDocumentJob = processorMod.processDocumentJob;

        const storageMod =
            await import('../../apps/worker-docs/src/services/storage.js');
        downloadObject =
            storageMod.downloadObject as MockedFunction<DownloadObject>;
        uploadObject = storageMod.uploadObject as MockedFunction<UploadObject>;

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // Happy paths
    // -------------------------------------------------------------------------

    it('md→html: returns outputObjectKey and calls uploadObject once', async () => {
        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.md, destPath);
            },
        );
        uploadObject.mockResolvedValue(undefined);

        const job = makeJob({ sourceExtension: 'md', targetExtension: 'html' });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/^outputs\//);
        expect(result.outputObjectKey).toMatch(/\.html$/);
        expect(result.outputSizeBytes).toBeGreaterThan(0);
        expect(uploadObject).toHaveBeenCalledOnce();

        const [, , contentType] = uploadObject.mock.calls[0] as [
            string,
            string,
            string,
        ];
        expect(contentType).toContain('text/html');
    });

    it('md→html: output contains HTML structure', async () => {
        let uploadedHtml = '';
        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.md, destPath);
            },
        );
        uploadObject.mockImplementation(
            async (_key: string, srcPath: string) => {
                uploadedHtml = await readFile(srcPath, 'utf8');
            },
        );

        const job = makeJob({ sourceExtension: 'md', targetExtension: 'html' });
        await processDocumentJob(job);

        expect(uploadedHtml).toMatch(/<html/i);
    });

    it('html→md: rejects unsafe HTML input', async () => {
        const job = makeJob({
            originalFileName: 'sample.html',
            sourceMime: 'text/html',
            sourceExtension: 'html',
            targetExtension: 'md',
        });

        await expect(processDocumentJob(job)).rejects.toThrow(
            'No document converter for html to md',
        );
        expect(uploadObject).not.toHaveBeenCalled();
    });

    it('txt→md: preserves plain text natively', async () => {
        let uploadedMarkdown = '';
        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.txt, destPath);
            },
        );
        uploadObject.mockImplementation(
            async (_key: string, srcPath: string) => {
                uploadedMarkdown = await readFile(srcPath, 'utf8');
            },
        );

        const job = makeJob({
            originalFileName: 'sample.txt',
            sourceMime: 'text/plain',
            sourceExtension: 'txt',
            targetExtension: 'md',
        });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/\.md$/);
        expect(uploadedMarkdown).toContain('Sample');
    });

    it('md→txt: produces plain text when Pandoc is available', async (ctx) => {
        if (!(await isPandocAvailable())) return ctx.skip();

        let uploadedText = '';
        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.md, destPath);
            },
        );
        uploadObject.mockImplementation(
            async (_key: string, srcPath: string) => {
                uploadedText = await readFile(srcPath, 'utf8');
            },
        );

        const job = makeJob({ sourceExtension: 'md', targetExtension: 'txt' });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/\.txt$/);
        expect(uploadedText).toMatch(/Sample/i);
    });

    it('md→pdf: produces pdf key (requires pandoc + pdflatex)', async (ctx) => {
        if (!(await isPandocPdfAvailable())) return ctx.skip();

        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.md, destPath);
            },
        );
        uploadObject.mockResolvedValue(undefined);

        const job = makeJob({ sourceExtension: 'md', targetExtension: 'pdf' });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/^outputs\//);
        expect(result.outputObjectKey).toMatch(/\.pdf$/);
        expect(result.outputSizeBytes).toBeGreaterThan(100);
        expect(uploadObject).toHaveBeenCalledOnce();
        const [, , contentType] = uploadObject.mock.calls[0] as [
            string,
            string,
            string,
        ];
        expect(contentType).toBe('application/pdf');
    });

    it('csv→xlsx: produces xlsx key when LibreOffice is available', async (ctx) => {
        if (!(await isLibreOfficeAvailable())) return ctx.skip();

        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.csv, destPath);
            },
        );
        uploadObject.mockResolvedValue(undefined);

        const job = makeJob({
            originalFileName: 'sample.csv',
            sourceMime: 'text/csv',
            sourceExtension: 'csv',
            targetExtension: 'xlsx',
        });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/\.xlsx$/);
        expect(result.outputSizeBytes).toBeGreaterThan(100);
    });

    it('docx→pdf: produces pdf key when LibreOffice is available', async (ctx) => {
        if (!(await isLibreOfficeAvailable())) return ctx.skip();
        const docxPath = await libreOfficeFixture(FIXTURES.rtf, 'docx');
        if (!docxPath) return ctx.skip();

        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(docxPath, destPath);
            },
        );
        uploadObject.mockResolvedValue(undefined);

        const job = makeJob({
            originalFileName: 'sample.docx',
            sourceMime:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            sourceExtension: 'docx',
            targetExtension: 'pdf',
        });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/\.pdf$/);
        expect(result.outputSizeBytes).toBeGreaterThan(100);
    });

    it('pptx→pdf: skips cleanly when no practical PPTX fixture is available', async (ctx) => {
        if (!(await isLibreOfficeAvailable())) return ctx.skip();
        const pptxPath = await libreOfficeFixture(FIXTURES.html, 'pptx');
        if (!pptxPath) return ctx.skip();

        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(pptxPath, destPath);
            },
        );
        uploadObject.mockResolvedValue(undefined);

        const job = makeJob({
            originalFileName: 'sample.pptx',
            sourceMime:
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            sourceExtension: 'pptx',
            targetExtension: 'pdf',
        });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/\.pdf$/);
    });

    it('xlsx→csv: exports first sheet when LibreOffice is available', async (ctx) => {
        if (!(await isLibreOfficeAvailable())) return ctx.skip();
        const xlsxPath = await libreOfficeFixture(FIXTURES.csv, 'xlsx');
        if (!xlsxPath) return ctx.skip();

        let uploadedCsv = '';
        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(xlsxPath, destPath);
            },
        );
        uploadObject.mockImplementation(
            async (_key: string, srcPath: string) => {
                uploadedCsv = await readFile(srcPath, 'utf8');
            },
        );

        const job = makeJob({
            originalFileName: 'sample.xlsx',
            sourceMime:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            sourceExtension: 'xlsx',
            targetExtension: 'csv',
        });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/\.csv$/);
        expect(uploadedCsv).toMatch(/Alpha/);
    });

    it('epub→html: produces html when Pandoc is available', async (ctx) => {
        if (!(await isPandocAvailable())) return ctx.skip();
        const epubPath = await pandocFixture(FIXTURES.md, 'epub');
        if (!epubPath) return ctx.skip();

        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(epubPath, destPath);
            },
        );
        uploadObject.mockResolvedValue(undefined);

        const job = makeJob({
            originalFileName: 'sample.epub',
            sourceMime: 'application/epub+zip',
            sourceExtension: 'epub',
            targetExtension: 'html',
        });
        const result = await processDocumentJob(job);

        expect(result.outputObjectKey).toMatch(/\.html$/);
        expect(result.outputSizeBytes).toBeGreaterThan(100);
    });

    it('md→pdf skips cleanly when Pandoc PDF toolchain is missing', async (ctx) => {
        if (await isPandocPdfAvailable()) return ctx.skip();

        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.md, destPath);
            },
        );
        uploadObject.mockResolvedValue(undefined);

        const job = makeJob({ sourceExtension: 'md', targetExtension: 'pdf' });
        await expect(processDocumentJob(job)).rejects.toThrow(
            /pdf|pandoc|latex/i,
        );
        expect(uploadObject).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // Failure paths
    // -------------------------------------------------------------------------

    it('throws when downloadObject fails (simulates missing S3 object)', async () => {
        downloadObject.mockRejectedValue(
            new Error('NoSuchKey: the object does not exist'),
        );
        const job = makeJob({ sourceExtension: 'md', targetExtension: 'html' });
        await expect(processDocumentJob(job)).rejects.toThrow('NoSuchKey');
    });

    it('throws for unsupported conversion route', async () => {
        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.txt, destPath);
            },
        );
        // txt→xlsx is not a supported conversion; the processor throws before uploading.
        const job = makeJob({
            originalFileName: 'sample.txt',
            sourceExtension: 'txt',
            targetExtension: 'xlsx',
        });
        await expect(processDocumentJob(job)).rejects.toThrow();
        expect(uploadObject).not.toHaveBeenCalled();
    });

    it('does not upload when conversion fails', async () => {
        downloadObject.mockImplementation(
            async (_key: string, destPath: string) => {
                await copyFile(FIXTURES.md, destPath);
            },
        );
        uploadObject.mockResolvedValue(undefined);

        const job = makeJob({
            sourceExtension: 'pdf',
            targetExtension: 'xlsx',
        }); // unsupported pair
        await expect(processDocumentJob(job)).rejects.toThrow();
        expect(uploadObject).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Output size cap — uses a fresh module import with a tiny limit
// ---------------------------------------------------------------------------

describe('processDocumentJob output size cap', () => {
    it('throws when output exceeds CONVERSION_MAX_OUTPUT_BYTES', async () => {
        const original = process.env.CONVERSION_MAX_OUTPUT_BYTES;
        process.env.CONVERSION_MAX_OUTPUT_BYTES = '1'; // 1 byte — any conversion output exceeds this

        vi.resetModules(); // discard cached env + processor modules

        vi.doMock('../../apps/worker-docs/src/services/storage.js', () => ({
            downloadObject: async (_key: string, destPath: string) => {
                const { copyFile: cp } = await import('node:fs/promises');
                await cp(FIXTURES.md, destPath);
            },
            uploadObject: vi.fn(),
        }));

        const { processDocumentJob: proc } =
            await import('../../apps/worker-docs/src/processors/documentProcessor.js');

        const id = crypto.randomUUID();
        const job: ConversionJob = {
            id,
            status: 'processing',
            kind: 'document',
            originalFileName: 'sample.md',
            sourceMime: 'text/plain',
            sourceExtension: 'md',
            targetExtension: 'html',
            fileSizeBytes: 512,
            inputObjectKey: `inputs/${id}/sample.md`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await expect(proc(job)).rejects.toThrow(/too large/i);

        // Restore env and module cache for subsequent test files.
        process.env.CONVERSION_MAX_OUTPUT_BYTES = original;
        vi.resetModules();
    });
});

// ---------------------------------------------------------------------------
// Worker integration tests — require running Redis + Postgres + MinIO
// ---------------------------------------------------------------------------

describe('Worker integration (requires infra)', () => {
    let infraAvailable = false;

    beforeEach(async () => {
        try {
            const res = await fetch('http://localhost:4010/ready', {
                signal: AbortSignal.timeout(2000),
            });
            const json = (await res.json()) as { ok: boolean };
            infraAvailable = json.ok === true;
        } catch {
            infraAvailable = false;
        }
        if (!infraAvailable) {
            console.log(
                '[worker-smoke] Infra not running — skipping infra-dependent worker tests.',
            );
        }
    });

    it('full md→html round-trip through queue (requires API + worker + infra)', async (ctx) => {
        if (!infraAvailable) return ctx.skip();

        // 1. Create job via API
        const createRes = await fetch('http://localhost:4010/v1/jobs', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                originalFileName: 'sample.md',
                sourceMime: 'text/plain',
                sourceExtension: 'md',
                targetExtension: 'html',
                fileSizeBytes: 512,
            }),
        });
        expect(createRes.status).toBe(201);
        const { jobId, uploadUrl } = (await createRes.json()) as {
            jobId: string;
            uploadUrl: string;
        };

        // 2. Upload the fixture to MinIO via the presigned URL
        const { readFile } = await import('node:fs/promises');
        const mdContent = await readFile(FIXTURES.md);
        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: mdContent,
            headers: { 'content-type': 'text/plain' },
        });
        expect(uploadRes.ok).toBe(true);

        // 3. Start the job
        const startRes = await fetch(
            `http://localhost:4010/v1/jobs/${jobId}/start`,
            {
                method: 'POST',
            },
        );
        expect(startRes.status).toBe(202);

        // 4. Poll until completed or failed (max 30 s)
        const deadline = Date.now() + 30_000;
        let lastStatus = '';
        while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 1500));
            const pollRes = await fetch(
                `http://localhost:4010/v1/jobs/${jobId}`,
            );
            const job = (await pollRes.json()) as {
                status: string;
                errorMessage?: string;
            };
            lastStatus = job.status;
            if (job.status === 'completed') break;
            if (job.status === 'failed') {
                throw new Error(`Job failed: ${job.errorMessage ?? 'unknown'}`);
            }
        }

        expect(lastStatus).toBe('completed');

        // 5. Get download URL
        const dlRes = await fetch(
            `http://localhost:4010/v1/jobs/${jobId}/download`,
        );
        expect(dlRes.status).toBe(200);
        const { downloadUrl } = (await dlRes.json()) as { downloadUrl: string };
        expect(typeof downloadUrl).toBe('string');
    });
});
