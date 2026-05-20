import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import { listConsentRecordsForUser } from '@/features/security/services/consentService';

export async function GET() {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json({
        consents: await listConsentRecordsForUser(supabase, userId),
    });
}
