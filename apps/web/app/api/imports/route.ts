import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { listImportJobs } from '@/features/import-export/services/importExportService';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const imports = await listImportJobs(supabase, userId);
        return NextResponse.json({ imports });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }
        if (isMissingTableError(err)) {
            return NextResponse.json({ imports: [] });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
