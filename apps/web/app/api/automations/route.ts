import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { listAutomationConfigsForUser } from '@/features/automation/services/automationService';

export async function GET() {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json({
        automations: await listAutomationConfigsForUser(supabase, userId),
    });
}
