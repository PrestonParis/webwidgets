import { NextResponse } from 'next/server';
import { listAdapters } from '@/features/import-export/lib/adapterRegistry';
import { trackingEntriesAdapter } from '@/features/import-export/adapters/trackingEntriesAdapter';
import { todosAdapter } from '@/features/import-export/adapters/todosAdapter';
import { collaborationHandoffsAdapter } from '@/features/import-export/adapters/collaborationHandoffsAdapter';
import { contextEntriesAdapter } from '@/features/import-export/adapters/contextEntriesAdapter';
import { registerAdapter } from '@/features/import-export/lib/adapterRegistry';
import type { AdapterCapability } from '@/features/import-export/types/importExport';

// Ensure all adapters are registered
function ensureAdaptersRegistered() {
    const adapters = [
        trackingEntriesAdapter,
        todosAdapter,
        collaborationHandoffsAdapter,
        contextEntriesAdapter,
    ];
    for (const adapter of adapters) {
        registerAdapter(adapter);
    }
}

// GET /api/import-export/capabilities
// Public capability discovery — no auth required
export async function GET() {
    ensureAdaptersRegistered();

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
                reason: 'xlsx package not installed — install it to enable Excel support',
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
                    'Merge fields (not fully implemented — behaves like overwrite)',
            },
            {
                id: 'keep_both',
                description: 'Always insert, keeping all duplicates',
            },
        ],
    });
}
