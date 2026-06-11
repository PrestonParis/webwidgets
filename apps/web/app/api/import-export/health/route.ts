import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { hasS3Config } from '@/lib/aws/s3Client';
import { listAdapters } from '@/features/import-export/lib/adapterRegistry';
import { registerCoreImportExportAdapters } from '@/features/import-export/lib/registerCoreAdapters';
import type {
    ServiceHealth,
    ServiceHealthItem,
} from '@/features/import-export/types/importExport';

function ensureAdaptersRegistered() {
    registerCoreImportExportAdapters();
}

// GET /api/import-export/health
// System health check — db, storage, adapter count
export async function GET() {
    ensureAdaptersRegistered();

    const services: ServiceHealthItem[] = [];
    let dbStatus: ServiceHealth['db'] = 'ok';
    let storageStatus: ServiceHealth['storage'] = 'unconfigured';

    // ── DB check ───────────────────────────────────────────────────────────────
    try {
        const { supabase } = await createClients();
        const { error } = await supabase
            .from('import_jobs')
            .select('id')
            .limit(1);
        if (error) {
            dbStatus = 'error';
            services.push({
                name: 'database',
                status: 'error',
                message: error.message,
            });
        } else {
            services.push({ name: 'database', status: 'ok' });
        }
    } catch (e) {
        dbStatus = 'error';
        services.push({
            name: 'database',
            status: 'error',
            message: e instanceof Error ? e.message : 'Unknown error',
        });
    }

    // ── Storage check ──────────────────────────────────────────────────────────
    if (hasS3Config()) {
        storageStatus = 'ok';
        services.push({ name: 'storage', status: 'ok' });
    } else {
        services.push({
            name: 'storage',
            status: 'unconfigured',
            message:
                'S3 not configured. File attachments are disabled; use text paste instead.',
        });
    }

    // ── Adapter availability ───────────────────────────────────────────────────
    const adapters = listAdapters();
    services.push({
        name: 'adapters',
        status: adapters.length > 0 ? 'ok' : 'unconfigured',
        message: `${adapters.length} adapter(s) registered`,
    });

    const health: ServiceHealth = {
        db: dbStatus,
        storage: storageStatus,
        adapters: adapters.length,
        services,
        checkedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, health });
}
