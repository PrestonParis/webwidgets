import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import type { ConversionJob } from '@webwidgets/conversion-shared';
import { env } from '../env.js';
import { runCommand } from '../lib/runCommand.js';

// ── CSV parsing ────────────────────────────────────────────────────────────────
// Pure-JS implementation — no npm dependency. Handles quoted fields,
// embedded commas, and CRLF line endings.

function parseCsvRow(line: string, delimiter: string): string[] {
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
        if (line[i] === '"') {
            // Quoted field
            let field = '';
            i++; // skip opening quote
            while (i < line.length) {
                if (line[i] === '"' && line[i + 1] === '"') {
                    field += '"';
                    i += 2;
                } else if (line[i] === '"') {
                    i++; // skip closing quote
                    break;
                } else {
                    field += line[i++];
                }
            }
            fields.push(field);
            if (line[i] === delimiter) i++;
        } else {
            // Unquoted field — read until delimiter or end
            const start = i;
            while (i < line.length && line[i] !== delimiter) i++;
            fields.push(line.slice(start, i));
            if (line[i] === delimiter) i++;
        }
    }
    return fields;
}

function delimitedToRecords(
    text: string,
    delimiter: string,
): Record<string, string>[] {
    const lines = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter((l) => l.trim().length > 0);

    if (lines.length === 0) return [];

    const headers = parseCsvRow(lines[0] ?? '', delimiter);
    const records: Record<string, string>[] = [];

    for (let r = 1; r < lines.length; r++) {
        const row = parseCsvRow(lines[r] ?? '', delimiter);
        const record: Record<string, string> = {};
        headers.forEach((h, idx) => {
            record[h] = row[idx] ?? '';
        });
        records.push(record);
    }
    return records;
}

function rowsToCsv(records: Record<string, string>[]): string {
    if (records.length === 0) return '';
    const headers = Object.keys(records[0] ?? {});

    function quoteField(val: string): string {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    }

    const lines = [
        headers.map(quoteField).join(','),
        ...records.map((r) =>
            headers.map((h) => quoteField(r[h] ?? '')).join(','),
        ),
    ];
    return lines.join('\n');
}

// ── xlsx → csv via LibreOffice (reuses existing binary) ───────────────────────

async function xlsxToCsvText(
    inputPath: string,
    workDir: string,
): Promise<string> {
    const profileDir = await mkdtemp(join(tmpdir(), 'lo-data-'));
    const userInstallation = `-env:UserInstallation=${pathToFileURL(profileDir).href}`;

    try {
        await runCommand(
            'libreoffice',
            [
                userInstallation,
                '--headless',
                '--convert-to',
                'csv',
                '--outdir',
                workDir,
                inputPath,
            ],
            { cwd: workDir, timeoutMs: env.CONVERSION_COMMAND_TIMEOUT_MS },
        );
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`LibreOffice xlsx→csv step failed: ${msg}`);
    } finally {
        await rm(profileDir, { recursive: true, force: true });
    }

    // LibreOffice names the csv after the input basename
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(workDir);
    const csvFile = files.find((f) => f.toLowerCase().endsWith('.csv'));
    if (!csvFile) {
        throw new Error('LibreOffice xlsx→csv produced no CSV output.');
    }
    return readFile(join(workDir, csvFile), 'utf8');
}

// ── Public converter ──────────────────────────────────────────────────────────

export async function convertDataFormat(
    job: ConversionJob,
    inputPath: string,
    outputPath: string,
    workDir: string,
): Promise<string> {
    const src = job.sourceExtension;
    const tgt = job.targetExtension;

    // tsv → csv: re-parse with tab delimiter, write as comma-delimited
    if (src === 'tsv' && tgt === 'csv') {
        const text = await readFile(inputPath, 'utf8');
        const records = delimitedToRecords(text, '\t');
        await writeFile(outputPath, rowsToCsv(records), 'utf8');
        return outputPath;
    }

    // csv → json: parse CSV, emit JSON array
    if (src === 'csv' && tgt === 'json') {
        const text = await readFile(inputPath, 'utf8');
        const records = delimitedToRecords(text, ',');
        await writeFile(outputPath, JSON.stringify(records, null, 2), 'utf8');
        return outputPath;
    }

    // tsv → json: parse TSV, emit JSON array
    if (src === 'tsv' && tgt === 'json') {
        const text = await readFile(inputPath, 'utf8');
        const records = delimitedToRecords(text, '\t');
        await writeFile(outputPath, JSON.stringify(records, null, 2), 'utf8');
        return outputPath;
    }

    // xlsx → json: LibreOffice exports to CSV first, then we parse
    if (src === 'xlsx' && tgt === 'json') {
        const csvText = await xlsxToCsvText(inputPath, workDir);
        const records = delimitedToRecords(csvText, ',');
        await writeFile(outputPath, JSON.stringify(records, null, 2), 'utf8');
        return outputPath;
    }

    throw new Error(`No native-data converter for ${src} to ${tgt}.`);
}
