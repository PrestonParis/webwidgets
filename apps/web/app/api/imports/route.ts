import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { listImportJobsForUser } from '@/features/import-export/services/importExportService';

export async function GET() {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json({
        imports: await listImportJobsForUser(supabase, userId),
    });
}
