import { describe, expect, it, vi } from 'vitest';
import { REPORT_SHEETS } from '../../../scripts/linting/googleSheetsReport';
import {
    appendRunRows,
    ensureHeader,
    ensureSheets,
    hasRun,
    parseServiceAccountCredentials,
    spreadsheetColumnName,
} from '../../../scripts/linting/googleSheetsPublisher';

type Client = Parameters<typeof ensureHeader>[0];

function clientWithRows(rows: unknown[][] | undefined) {
    const get = vi.fn().mockResolvedValue({ data: { values: rows } });
    const update = vi.fn().mockResolvedValue({ data: {} });
    const append = vi.fn().mockResolvedValue({ data: {} });
    return {
        client: {
            spreadsheets: { values: { append, get, update } },
        } as unknown as Client,
        append,
        get,
        update,
    };
}

describe('Google Sheets publisher boundaries', () => {
    it('creates every missing report sheet in one batch', async () => {
        const get = vi.fn().mockResolvedValue({
            data: { sheets: [{ properties: { title: 'Daily Runs' } }] },
        });
        const batchUpdate = vi.fn().mockResolvedValue({ data: {} });
        const client = {
            spreadsheets: { batchUpdate, get },
        } as unknown as Parameters<typeof ensureSheets>[0];

        await ensureSheets(client, 'sheet-id');

        expect(batchUpdate).toHaveBeenCalledOnce();
        expect(batchUpdate).toHaveBeenCalledWith({
            spreadsheetId: 'sheet-id',
            requestBody: {
                requests: [
                    { addSheet: { properties: { title: 'Lint Findings' } } },
                    {
                        addSheet: {
                            properties: { title: 'TypeScript Findings' },
                        },
                    },
                    { addSheet: { properties: { title: 'Code Smells' } } },
                    {
                        addSheet: {
                            properties: { title: 'Repository Stats' },
                        },
                    },
                ],
            },
        });
    });

    it('does not mutate a spreadsheet that already has every report sheet', async () => {
        const get = vi.fn().mockResolvedValue({
            data: {
                sheets: Object.values(REPORT_SHEETS).map(({ title }) => ({
                    properties: { title },
                })),
            },
        });
        const batchUpdate = vi.fn().mockResolvedValue({ data: {} });
        const client = {
            spreadsheets: { batchUpdate, get },
        } as unknown as Parameters<typeof ensureSheets>[0];

        await ensureSheets(client, 'sheet-id');

        expect(batchUpdate).not.toHaveBeenCalled();
    });

    it('rejects malformed credentials without exposing their contents', () => {
        const secretFragment = 'PRIVATE-KEY-FRAGMENT';
        expect(() =>
            parseServiceAccountCredentials(`{"private_key":"${secretFragment}`),
        ).toThrow('Invalid Google Sheets service account credentials');
        try {
            parseServiceAccountCredentials(`{"private_key":"${secretFragment}`);
        } catch (error) {
            expect(String(error)).not.toContain(secretFragment);
        }
    });

    it('supports spreadsheet columns beyond Z', () => {
        expect(spreadsheetColumnName(1)).toBe('A');
        expect(spreadsheetColumnName(26)).toBe('Z');
        expect(spreadsheetColumnName(27)).toBe('AA');
        expect(spreadsheetColumnName(52)).toBe('AZ');
    });

    it('creates an empty header with RAW input mode', async () => {
        const { client, update } = clientWithRows(undefined);
        await ensureHeader(client, 'sheet-id', REPORT_SHEETS.daily);
        expect(update).toHaveBeenCalledWith(
            expect.objectContaining({
                range: "'Daily Runs'!A1",
                valueInputOption: 'RAW',
            }),
        );
    });

    it('refuses to write through a changed header', async () => {
        const { client, update } = clientWithRows([['Unexpected']]);
        await expect(
            ensureHeader(client, 'sheet-id', REPORT_SHEETS.daily),
        ).rejects.toThrow('Daily Runs has an unexpected header row');
        expect(update).not.toHaveBeenCalled();
    });

    it('detects an existing run id', async () => {
        const { client } = clientWithRows([['41'], ['42']]);
        await expect(
            hasRun(client, 'sheet-id', 'Daily Runs', '42'),
        ).resolves.toBe(true);
    });

    it('does not append a run twice', async () => {
        const { append, client } = clientWithRows([['42']]);
        await appendRunRows(
            client,
            'sheet-id',
            REPORT_SHEETS.daily,
            [['42']],
            '42',
        );
        expect(append).not.toHaveBeenCalled();
    });

    it('appends new rows with a bounded RAW range', async () => {
        const { append, client } = clientWithRows([]);
        await appendRunRows(
            client,
            'sheet-id',
            REPORT_SHEETS.daily,
            [['43', '=not a formula']],
            '43',
        );
        expect(append).toHaveBeenCalledWith(
            expect.objectContaining({
                range: "'Daily Runs'!A:O",
                valueInputOption: 'RAW',
            }),
        );
    });
});
