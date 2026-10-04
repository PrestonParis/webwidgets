import type { sheets_v4 } from 'googleapis';
import { z } from 'zod';
import { REPORT_SHEETS, type SheetValue } from './googleSheetsReport';

const credentialsSchema = z
    .object({
        client_email: z.string().email(),
        private_key: z.string().min(1),
    })
    .passthrough();

type SheetsClient = sheets_v4.Sheets;
type SheetDefinition = (typeof REPORT_SHEETS)[keyof typeof REPORT_SHEETS];

export function parseServiceAccountCredentials(raw: string) {
    try {
        return credentialsSchema.parse(JSON.parse(raw) as unknown);
    } catch {
        throw new Error('Invalid Google Sheets service account credentials');
    }
}

export function spreadsheetColumnName(column: number): string {
    if (!Number.isInteger(column) || column < 1)
        throw new Error('Spreadsheet column must be a positive integer');
    let current = column;
    let result = '';
    while (current > 0) {
        current -= 1;
        result = String.fromCharCode(65 + (current % 26)) + result;
        current = Math.floor(current / 26);
    }
    return result;
}

function quoteSheet(title: string): string {
    return `'${title.replaceAll("'", "''")}'`;
}

export async function ensureSheets(
    client: SheetsClient,
    spreadsheetId: string,
): Promise<void> {
    const response = await client.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title',
    });
    const existing = new Set(
        response.data.sheets?.flatMap((sheet) =>
            sheet.properties?.title ? [sheet.properties.title] : [],
        ) ?? [],
    );
    const missing = Object.values(REPORT_SHEETS).filter(
        (definition) => !existing.has(definition.title),
    );
    if (missing.length === 0) return;
    await client.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: missing.map((definition) => ({
                addSheet: { properties: { title: definition.title } },
            })),
        },
    });
}

export async function ensureHeader(
    client: SheetsClient,
    spreadsheetId: string,
    definition: SheetDefinition,
): Promise<void> {
    const range = `${quoteSheet(definition.title)}!1:1`;
    const response = await client.spreadsheets.values.get({
        spreadsheetId,
        range,
    });
    const existing = response.data.values?.[0]?.map(String) ?? [];
    if (existing.length === 0) {
        await client.spreadsheets.values.update({
            spreadsheetId,
            range: `${quoteSheet(definition.title)}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [[...definition.headers]] },
        });
        return;
    }
    if (existing.join('\u0000') !== definition.headers.join('\u0000')) {
        throw new Error(`${definition.title} has an unexpected header row`);
    }
}

export async function hasRun(
    client: SheetsClient,
    spreadsheetId: string,
    title: string,
    runId: string,
): Promise<boolean> {
    const response = await client.spreadsheets.values.get({
        spreadsheetId,
        range: `${quoteSheet(title)}!A2:A`,
    });
    return (
        response.data.values?.some((row) => String(row[0] ?? '') === runId) ??
        false
    );
}

export async function appendRunRows(
    client: SheetsClient,
    spreadsheetId: string,
    definition: SheetDefinition,
    rows: SheetValue[][],
    runId: string,
): Promise<void> {
    if (
        rows.length === 0 ||
        (await hasRun(client, spreadsheetId, definition.title, runId))
    )
        return;
    await client.spreadsheets.values.append({
        spreadsheetId,
        range: `${quoteSheet(definition.title)}!A:${spreadsheetColumnName(definition.headers.length)}`,
        insertDataOption: 'INSERT_ROWS',
        valueInputOption: 'RAW',
        requestBody: { values: rows },
    });
}
