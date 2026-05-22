import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import { BACKEND_INTEGRATION_PROVIDERS } from '@/features/integrations/services/integrationProviderRegistry';
import { listIntegrationConnectionsForUser } from '@/features/integrations/services/integrationService';

export async function GET() {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json({
        providers: BACKEND_INTEGRATION_PROVIDERS,
        connections: await listIntegrationConnectionsForUser(supabase, userId),
    });
}
