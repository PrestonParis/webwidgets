import { NextResponse } from 'next/server';
import { listAdapters } from '@/features/import-export/lib/adapterRegistry';
import { registerCoreImportExportAdapters } from '@/features/import-export/lib/registerCoreAdapters';
import type { AdapterCapability } from '@/features/import-export/types/importExport';

// GET /api/import-export/capabilities
// Public capability discovery — no auth required
export function GET() {
    registerCoreImportExportAdapters();

    const adapters = listAdapters();
    const capabilities: AdapterCapability[] = adapters.map((a) => ({
        id: a.id,
        displayName: a.displayName,
        description: a.description,
        sourceType: a.sourceType,
        canImport: a.canImport,
        canExport: a.canExport,
        canProvideContext: a.canProvideContext,
        importFormats: a.importFormats,
        exportFormats: a.exportFormats,
    }));

    return NextResponse.json({
        ok: true,
        capabilities,
        formats: ['csv', 'json'],
        unsupportedFormats: [
            {
                format: 'xlsx',
                reason: 'xlsx package not installed. Install it to enable Excel support.',
            },
            {
                format: 'google_sheets',
                reason: 'Google Sheets API not configured',
            },
            {
                format: 'zip',
                reason: 'jszip package not installed',
            },
        ],
        duplicateStrategies: [
            { id: 'skip', description: 'Skip rows that already exist' },
            { id: 'overwrite', description: 'Overwrite existing rows' },
            {
                id: 'merge',
                description:
                    'Merge fields (not fully implemented, behaves like overwrite)',
            },
            {
                id: 'keep_both',
                description: 'Always insert, keeping all duplicates',
            },
        ],
    });
}
