import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { google } from 'googleapis';
import { z } from 'zod';
import { ROOT } from './lib/paths';
import {
    buildReportRows,
    REPORT_SHEETS,
    type ReportInputs,
} from './googleSheetsReport';
import {
    appendRunRows,
    ensureHeader,
    ensureSheets,
    parseServiceAccountCredentials,
} from './googleSheetsPublisher';

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

async function publish(): Promise<void> {
    const env = environmentSchema.parse(process.env);
    const credentials = parseServiceAccountCredentials(
        env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON,
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
