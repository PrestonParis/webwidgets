import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { google, sheets_v4 } from 'googleapis';
import { z } from 'zod';
import { ROOT } from './lib/paths';
import {
    buildReportRows,
    REPORT_SHEETS,
    type ReportInputs,
    type SheetValue,
} from './googleSheetsReport';

const credentialsSchema = z
    .object({
        client_email: z.string().email(),
        private_key: z.string().min(1),
    })
    .passthrough();

const environmentSchema = z.object({
    GITHUB_REF_NAME: z.string().default('local'),
    GITHUB_REPOSITORY: z.string().optional(),
    GITHUB_RUN_ID: z.string().optional(),
    GITHUB_SERVER_URL: z.string().url().default('https://github.com'),
    GITHUB_SHA: z.string().default('local'),
    GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON: z.string().min(1),
    GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1),
    LINT_REPORT_RUN_ID: z.string().optional(),
});

type SheetsClient = sheets_v4.Sheets;
type SheetDefinition = (typeof REPORT_SHEETS)[keyof typeof REPORT_SHEETS];

function readJson(path: string): unknown {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function loadReports(): ReportInputs {
    return {
        lint: readJson(join(ROOT, 'reports/lint/latest.json')),
        smells: readJson(join(ROOT, 'reports/smells/latest.json')),
        stats: readJson(join(ROOT, 'reports/stats/latest.json')),
        ts: readJson(join(ROOT, 'reports/ts/latest.json')),
    };
}

function quoteSheet(title: string): string {
    return `'${title.replaceAll("'", "''")}'`;
}

async function ensureSheets(
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

async function ensureHeader(
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

async function hasRun(
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

async function appendRunRows(
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
        range: `${quoteSheet(definition.title)}!A:${String.fromCharCode(64 + definition.headers.length)}`,
        insertDataOption: 'INSERT_ROWS',
        valueInputOption: 'RAW',
        requestBody: { values: rows },
    });
}

async function publish(): Promise<void> {
    const env = environmentSchema.parse(process.env);
    const credentials = credentialsSchema.parse(
        JSON.parse(env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON) as unknown,
    );
    const runAt = new Date().toISOString();
    const runId =
        env.LINT_REPORT_RUN_ID ?? env.GITHUB_RUN_ID ?? `local-${runAt}`;
    const workflowRunUrl =
        env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
            ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
            : '';
    const rows = buildReportRows(loadReports(), {
        branch: env.GITHUB_REF_NAME,
        commitSha: env.GITHUB_SHA,
        runAt,
        runId,
        workflowRunUrl,
    });
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = google.sheets({ version: 'v4', auth });
    await ensureSheets(client, env.GOOGLE_SHEETS_SPREADSHEET_ID);
    for (const definition of Object.values(REPORT_SHEETS)) {
        await ensureHeader(
            client,
            env.GOOGLE_SHEETS_SPREADSHEET_ID,
            definition,
        );
    }
    await appendRunRows(
        client,
        env.GOOGLE_SHEETS_SPREADSHEET_ID,
        REPORT_SHEETS.lint,
        rows.lint,
        runId,
    );
    await appendRunRows(
        client,
        env.GOOGLE_SHEETS_SPREADSHEET_ID,
        REPORT_SHEETS.ts,
        rows.ts,
        runId,
    );
    await appendRunRows(
        client,
        env.GOOGLE_SHEETS_SPREADSHEET_ID,
        REPORT_SHEETS.smells,
        rows.smells,
        runId,
    );
    await appendRunRows(
        client,
        env.GOOGLE_SHEETS_SPREADSHEET_ID,
        REPORT_SHEETS.stats,
        rows.stats,
        runId,
    );
    await appendRunRows(
        client,
        env.GOOGLE_SHEETS_SPREADSHEET_ID,
        REPORT_SHEETS.daily,
        rows.daily,
        runId,
    );
    process.stdout.write(`Published lint report run ${runId}\n`);
}

publish().catch((error: unknown) => {
    const message =
        error instanceof Error ? error.message : 'Unknown publishing error';
    process.stderr.write(`Failed to publish lint report: ${message}\n`);
    process.exitCode = 1;
});
